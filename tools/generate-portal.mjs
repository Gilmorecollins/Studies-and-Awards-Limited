import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import vm from 'vm';
import { THEME_SCRIPT, themeToggle } from './theme-markup.mjs';

// Builds the student portal pages in site/portal/ from the templates below, so
// the sidebar, header and footer stay identical on every page.
//
//   node tools/generate-portal.mjs           write site/portal/*.html
//   node tools/generate-portal.mjs --check   change nothing; exit 1 if a page in
//                                            site/portal/ differs from this script
//
// Everything a student sees is SAMPLE DATA (the `sample` object below): the
// portal is a front end only. Signing in, saving an application, uploading
// documents and paying need a server behind it; until then those actions say
// so instead of pretending. Styles: site/css/portal.css. Behaviour: site/js/portal.js,
// and site/js/theme.js for the dark mode switch (shared with the main site).
//
// The counsellor shown throughout is the team member flagged `portalCounsellor`
// in site/js/team-data.js (else the `startHere` person, else the first person);
// name, role, photo and WhatsApp number come from there.

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteDir = join(__dirname, '..', 'site');
const outRoot = join(siteDir, 'portal');

const OFFICE_TEL = '+254721796500';
const OFFICE_TEL_LABEL = '+254 721 796500';
const OFFICE_MAIL = 'admissions@studiesandawardsltd.com';
const YEAR = 2026;

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---- the counsellor, from the team data ----
const team = (() => {
  const box = { window: {} };
  vm.runInNewContext(readFileSync(join(siteDir, 'js', 'team-data.js'), 'utf8'), box);
  return box.window.TEAM_MEMBERS || [];
})();
const counsellorMember = team.find(m => m.portalCounsellor) || team.find(m => m.startHere) || team[0];
const waDigits = String(counsellorMember.whatsapp || '').replace(/\D/g, '');
const counsellor = {
  name: counsellorMember.name,
  first: counsellorMember.name.split(' ')[0],
  role: counsellorMember.role,
  photo: '../' + (counsellorMember.thumb || counsellorMember.photo),
  wa: text => waDigits ? `https://wa.me/${waDigits}?text=${encodeURIComponent(text)}` : `mailto:${OFFICE_MAIL}`,
  tel: waDigits ? '+' + waDigits : OFFICE_TEL,
};

// ---- sample data (what a student part-way through sees) ----
const sample = {
  first: 'Amina', last: 'Chebet', initials: 'AC', place: 'Eldoret, Kenya',
  courses: [
    { id: 'cdu-nursing', level: 'Undergraduate', name: 'Bachelor of Nursing', uni: 'Charles Darwin University', city: 'Darwin', country: 'Australia', flag: 'australia', shortlisted: true },
    { id: 'acu-mba', level: 'Postgraduate', name: 'Master of Business Administration', uni: 'Australian Catholic University', city: 'Canberra', country: 'Australia', flag: 'australia' },
    { id: 'cit-it', level: 'Diploma', name: 'Diploma of Information Technology', uni: 'Canberra Institute of Technology', city: 'Canberra', country: 'Australia', flag: 'australia' },
  ],
  applications: [
    { id: 'A-1042', course: 'cdu-nursing', stage: 2, status: ['green', 'Offer received'] },
    { id: 'A-1057', course: 'cit-it', stage: 1, status: ['blue', 'Under review'], action: 'Canberra Institute of Technology needs your School Completion Letter.' },
  ],
  services: [
    { id: 'V-2210', service: 'Student visa application', country: 'Australia', flag: 'australia', details: 'Biometrics booked. Waiting for your medical appointment.', status: ['blue', 'In progress'] },
    { id: 'V-2231', service: 'Discounted student air ticket', country: 'Australia', flag: 'australia', details: 'We&rsquo;ll share flight options once your visa is granted.', status: ['grey', 'Waiting on visa'] },
  ],
  invoices: [
    { no: 'INV-0031', date: '22 Sep 2026', due: '6 Oct 2026', amount: 25000, item: 'University application processing', paid: false },
    { no: 'INV-0024', date: '14 Aug 2026', paid_on: '16 Aug 2026', amount: 10000, item: 'IELTS preparation classes', paid: true },
    { no: 'INV-0017', date: '02 Jul 2026', paid_on: '03 Jul 2026', amount: 5000, item: 'Registration fee', paid: true },
  ],
  notifications: [
    ['alert', 'Canberra Institute of Technology needs your School Completion Letter.', '2 hours ago'],
    ['check', 'Charles Darwin University has made you an offer for the Bachelor of Nursing.', 'Yesterday'],
    ['receipt', 'Invoice INV-0031 (KES 25,000) is due on 6 Oct.', '22 Sep'],
  ],
};
const courseById = Object.fromEntries(sample.courses.map(c => [c.id, c]));
const kes = n => 'KES ' + n.toLocaleString('en-US');

// Templates and forms on the Resources page. Put a file in site/assets/portal/
// and set `file` to its name to make its Download button work; until then the
// button says the template hasn't been added yet.
const resources = [
  ['Sponsors documents', 'templates to download, fill in and upload with your application', [
    ['Template letter to bank authorizing verification of bank statements', ''],
    ['Bank cover letter sample', ''],
    ['Sponsorship consent form', ''],
    ['Affidavit of Support Template', ''],
  ]],
  ['Statement of purpose', 'guidance for writing your statement', [
    ['Statement of purpose guide', ''],
  ]],
  ['Personal documents', 'templates for your own documents', [
    ['CV template', ''],
    ['Reference letter template', ''],
  ]],
  ['Institution documents', 'letters universities and colleges ask for', [
    ['University Cover Letter', ''],
    ['School Completion Letter request', ''],
  ]],
  ['Visa application documents', 'forms and checklists for your visa', [
    ['Visa document checklist', ''],
    ['Financial capacity declaration', ''],
  ]],
];

// ---- icons (24px grid, stroked) ----
const ICONS = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
  pen: 'M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  list: 'M9 6h11 M9 12h11 M9 18h11 M4 6h.01 M4 12h.01 M4 18h.01',
  passport: 'M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z M9 11a3 3 0 1 0 6 0a3 3 0 1 0-6 0 M9 17h6',
  receipt: 'M4 2v20l3-2 3 2 3-2 3 2 3-2 1 1V2l-1 1-3-2-3 2-3-2-3 2-3-2z M8 8h8 M8 12h8 M8 16h5',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  user: 'M12 12a4 4 0 1 0 0-8a4 4 0 1 0 0 8z M4 21a8 8 0 0 1 16 0',
  signout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9 M10.3 21a1.94 1.94 0 0 0 3.4 0',
  upload: 'M12 16V4 M7 9l5-5 5 5 M5 20h14',
  download: 'M12 3v12 M7 10l5 5 5-5 M5 21h14',
  check: 'M20 6 9 17l-5-5',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  chat: 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z',
  bookmark: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
  chevron: 'M6 9l6 6 6-6',
  alert: 'M12 9v4 M12 17h.01 M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  plus: 'M12 5v14M5 12h14',
  calendar: 'M4 5h16v16H4z M4 10h16 M9 3v4 M15 3v4',
  search: 'M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M21 21l-4.35-4.35',
  lock: 'M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4',
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M22 6l-10 7L2 6',
  close: 'M18 6 6 18M6 6l12 12',
  menu: 'M4 7h16M4 12h16M4 17h16',
};
const icon = (name, size = 18, cls = '') =>
  `<svg class="p-i${cls ? ' ' + cls : ''}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;
const flag = (slug, w, h) => `<img class="p-flag" src="../assets/flags/${slug}.svg" alt="" width="${w}" height="${h}">`;
const pill = ([tone, label]) => `<span class="p-status p-status-${tone}">${label}</span>`;

const NAV = [
  ['dashboard', 'Home', 'home'],
  ['courses', 'Course suggestions', 'book'],
  ['apply', 'Study abroad apply', 'pen'],
  ['applications', 'Track applications', 'list'],
  ['visa', 'Visa &amp; services', 'passport'],
  ['fees', 'Fees', 'receipt'],
  ['resources', 'Resources', 'folder'],
  ['account', 'My account', 'user'],
];

const head = title => `<!doctype html>
<html lang="en" data-sample="progress">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Student Portal · Studies and Awards</title>
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#001B5E">
<link rel="icon" type="image/png" href="../assets/favicon.png">
<link rel="preload" href="../assets/fonts/montserrat.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="../assets/fonts/bebas-neue.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="../assets/fonts/oswald.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="../css/portal.css">
${THEME_SCRIPT}
<script>try { if (localStorage.getItem('sa-portal-sample') === 'new') document.documentElement.setAttribute('data-sample', 'new'); } catch (e) {}</script>
</head>`;

const brand = (href, big) => `<a class="p-brand${big ? ' p-brand-lg' : ''}" href="${href}">
      <span class="p-brand-mark"><img src="../assets/logo-mark.png" alt="" width="120" height="80"></span>
      <span class="p-brand-text"><span class="p-brand-name">Studies &amp; Awards</span><span class="p-brand-sub">Student portal</span></span>
    </a>`;

const counsellorCard = (eyebrow = 'Your counsellor') => `<section class="p-card p-counsellor" aria-label="Your counsellor">
          <span class="p-eyebrow">${eyebrow}</span>
          <div class="p-counsellor-who">
            <img src="${counsellor.photo}" alt="" width="64" height="64">
            <div><p class="p-counsellor-name">${esc(counsellor.name)}</p><p class="p-counsellor-role">${esc(counsellor.role)}</p></div>
          </div>
          <div class="p-counsellor-actions">
            <a class="p-btn p-btn-wa" href="${counsellor.wa(`Hello ${counsellor.first}, I have a question about my application. (Sent from the student portal)`)}" target="_blank" rel="noopener noreferrer">${icon('chat', 16)}WhatsApp<span class="sr-only"> ${esc(counsellor.first)} (opens in a new tab)</span></a>
            <a class="p-btn-round" href="tel:${counsellor.tel}" aria-label="Call ${esc(counsellor.first)}">${icon('phone', 17)}</a>
          </div>
        </section>`;

const empty = (ic, title, text, action) => `<div class="p-card p-empty">
          <span class="p-empty-icon">${icon(ic, 28)}</span>
          <h2>${title}</h2>
          <p>${text}</p>
          ${action}
        </div>`;

function shell({ slug, title, heading, sub, subNew, body, dialogs = '' }) {
  const nav = NAV.map(([s, label, ic]) => `        <a href="${s}.html"${s === slug ? ' aria-current="page"' : ''}>${icon(ic, 19)}<span>${label}</span></a>`).join('\n');
  const notes = sample.notifications.map(([ic, text, when]) => `            <li>${icon(ic, 16)}<div><p>${text}</p><span>${when}</span></div></li>`).join('\n');
  return `${head(title)}
<body>
<a class="skip-link" href="#p-content">Skip to content</a>
<div class="p-app">
  <aside class="p-side" id="p-side" aria-label="Student portal menu">
    ${brand('dashboard.html')}
    <div class="p-side-user"><span class="p-avatar-sm" aria-hidden="true">${sample.initials}</span><span><span class="p-side-welcome">Welcome</span><span class="p-side-name">${sample.first} ${sample.last}</span></span></div>
    <nav class="p-nav" aria-label="Portal">
      <span class="p-nav-label">Menu</span>
${nav}
    </nav>
    <div class="p-side-help">
      <p class="p-side-help-title">Need help?</p>
      <p>Our counsellors are in Eldoret, Mon&ndash;Fri, 8am&ndash;5pm.</p>
      <a href="tel:${OFFICE_TEL}">${icon('phone', 15)}${OFFICE_TEL_LABEL}</a>
    </div>
    <a class="p-side-link" href="../index.html">${icon('home', 18)}Main website</a>
    <a class="p-side-link" href="index.html" data-signout>${icon('signout', 18)}Sign out</a>
  </aside>
  <div class="p-scrim" hidden></div>
  <div class="p-main">
    <header class="p-top">
      <button type="button" class="p-menu" aria-controls="p-side" aria-expanded="false" aria-label="Open menu">${icon('menu', 22)}</button>
      <div class="p-top-title">
        <h1>${heading}</h1>
        <p${subNew ? ' data-when="progress"' : ''}>${sub}</p>${subNew ? `\n        <p data-when="new">${subNew}</p>` : ''}
      </div>
      <div class="p-top-tools">
        <button type="button" class="p-sample" aria-describedby="p-sample-tip">Sample data<span class="p-sample-mode" data-when="progress">In progress</span><span class="p-sample-mode" data-when="new">New student</span></button>
        <span class="sr-only" id="p-sample-tip">This is a preview filled with sample data. Press to switch between a student part-way through and a brand-new student.</span>
        <a class="p-top-mail" href="mailto:${OFFICE_MAIL}">${icon('mail', 15)}${OFFICE_MAIL}</a>
        ${themeToggle('        ')}
        <div class="p-notify">
          <button type="button" class="p-bell" aria-expanded="false" aria-controls="p-notes" aria-label="Notifications">${icon('bell', 18)}<span class="p-bell-dot" data-when="progress"></span></button>
          <div class="p-notes" id="p-notes" hidden>
            <p class="p-notes-title">Notifications</p>
            <ul data-when="progress">
${notes}
            </ul>
            <ul data-when="new">
              <li>${icon('home', 16)}<div><p>Welcome to your student portal. Start by completing your profile.</p><span>Today</span></div></li>
            </ul>
          </div>
        </div>
        <a class="p-avatar" href="account.html" aria-label="My account">${sample.initials}</a>
      </div>
    </header>
    <main class="p-content" id="p-content" tabindex="-1">
${body}
    </main>
    <footer class="p-foot">&copy; ${YEAR}, Studies and Awards Limited. All rights reserved.</footer>
  </div>
</div>
<div class="p-toast" role="status" aria-live="polite"></div>
${dialogs}<script src="../js/theme.js"></script>
<script src="../js/portal.js"></script>
</body>
</html>
`;
}

// ---------- pages ----------

const JOURNEY = ['Profile', 'Course suggestions', 'University applications', 'Visa', 'Travel'];
const journey = current => `<ol class="p-journey">
${JOURNEY.map((label, i) => {
  const state = i < current ? 'done' : i === current ? 'now' : 'todo';
  return `            <li class="is-${state}"${state === 'now' ? ' aria-current="step"' : ''}><span class="p-journey-dot">${state === 'done' ? icon('check', 16) + `<span class="sr-only">Done: </span>` : i + 1}</span><span class="p-journey-label">${label}</span></li>`;
}).join('\n')}
          </ol>`;

const stat = (ic, value, label, note, extra = '') => `<div class="p-card p-stat${extra}"><span class="p-stat-icon">${icon(ic, 20)}</span><span class="p-stat-value">${value}</span><span class="p-stat-label">${label}</span><span class="p-stat-note">${note}</span></div>`;

const appRow = a => {
  const c = courseById[a.course];
  return `<li class="p-app-row">${flag(c.flag, 40, 27)}<div><p class="p-app-course">${c.name}</p><p class="p-app-uni">${c.uni} &middot; ${c.city}, ${c.country}</p></div>${pill(a.status)}</li>`;
};

const templateLinks = [resources[0][2][2], resources[0][2][3], resources[3][2][0]];
const resourceLink = ([name, file], cls) => file
  ? `<a class="${cls}" href="../assets/portal/${file}" download>`
  : `<a class="${cls}" href="#" data-toast="&ldquo;${esc(name)}&rdquo; hasn&rsquo;t been added yet. Ask your counsellor for a copy.">`;

function dashboard() {
  const body = `      <div data-when="progress" class="p-stack">
        <section class="p-hero" aria-labelledby="hero-title">
          <div class="p-hero-top">
            <div>
              <span class="p-eyebrow p-eyebrow-gold">Your journey &middot; EDL &rarr; Australia</span>
              <h2 class="p-hero-title" id="hero-title">Welcome back, ${sample.first}</h2>
              <p class="p-hero-text">You&rsquo;re at stage 3 of 5. One university has already made you an offer.</p>
            </div>
            <div class="p-next">
              <span class="p-next-label">Next step</span>
              <p class="p-next-title">Upload your School Completion Letter</p>
              <p class="p-next-text">Canberra Institute of Technology needs it to finish reviewing your application.</p>
              <a class="p-btn p-btn-navy" href="apply.html#documents">${icon('upload', 16)}Upload now</a>
            </div>
          </div>
          ${journey(2)}
        </section>
        <div class="p-stats p-stats-4">
          ${stat('list', '2', 'Applications', '1 offer &middot; 1 under review')}
          ${stat('book', '3', 'Course suggestions', '1 shortlisted')}
          ${stat('file', '6/9', 'Documents uploaded', '3 still needed')}
          ${stat('receipt', '1', 'Invoice due', 'Due in 12 days')}
        </div>
        <div class="p-split">
          <section class="p-card" aria-labelledby="apps-title">
            <div class="p-card-head"><h2 id="apps-title">My applications</h2><a class="p-more" href="applications.html">View all${icon('arrow', 14)}</a></div>
            <ul class="p-app-list">
              ${sample.applications.map(appRow).join('\n              ')}
            </ul>
          </section>
          <div class="p-stack">
            ${counsellorCard()}
            <section class="p-card" aria-labelledby="tpl-title">
              <div class="p-card-head"><h2 id="tpl-title">Useful templates</h2><a class="p-more" href="resources.html">All resources${icon('arrow', 14)}</a></div>
              <ul class="p-tpl-list">
${templateLinks.map(r => `                <li>${resourceLink(r, 'p-tpl')}${icon('file', 18, 'p-i-gold')}<span>${r[0]}</span>${icon('download', 17)}</a></li>`).join('\n')}
              </ul>
            </section>
          </div>
        </div>
      </div>

      <div data-when="new" class="p-stack">
        <section class="p-hero" aria-labelledby="hero-title-new">
          <div>
            <span class="p-eyebrow p-eyebrow-gold">Welcome to your student portal</span>
            <h2 class="p-hero-title" id="hero-title-new">Let&rsquo;s get you started, ${sample.first}</h2>
            <p class="p-hero-text">Three steps take you from your profile to your first university application.</p>
          </div>
          ${journey(0)}
        </section>
        <ol class="p-steps">
          <li class="p-card p-step-card"><div class="p-step-top"><span class="p-stat-icon">${icon('pen', 20)}</span><span class="p-step-num" aria-hidden="true">01</span></div><h2>Complete your profile</h2><p>Update your profile and education details, and upload your documents.</p><a class="p-btn p-btn-gold" href="apply.html">Apply for study abroad</a></li>
          <li class="p-card p-step-card"><div class="p-step-top"><span class="p-stat-icon">${icon('book', 20)}</span><span class="p-step-num" aria-hidden="true">02</span></div><h2>Get course suggestions</h2><p>Our team of experts will evaluate your profile and suggest courses for you.</p><a class="p-btn p-btn-outline" href="courses.html">See course suggestions</a></li>
          <li class="p-card p-step-card"><div class="p-step-top"><span class="p-stat-icon">${icon('list', 20)}</span><span class="p-step-num" aria-hidden="true">03</span></div><h2>Track your applications</h2><p>Follow each university application and meet the requirements at every stage.</p><a class="p-btn p-btn-outline" href="applications.html">Track applications</a></li>
        </ol>
        <div class="p-split">
          <div class="p-card p-free"><span class="p-free-icon">${icon('check', 26)}</span><div><h2>Your first consultation is free</h2><p>Not sure which country or course is right for you? Book a free consultation and a counsellor will guide you.</p></div></div>
          ${counsellorCard()}
        </div>
      </div>`;
  return shell({ slug: 'dashboard', title: 'Dashboard', heading: 'Student dashboard', sub: 'Everything about your application, in one place.', subNew: 'Start here: it takes about 10 minutes to set up your profile.', body });
}

function courses() {
  const shortlisted = sample.courses.filter(c => c.shortlisted).length;
  const cards = sample.courses.map(c => `            <li class="p-card p-course${c.shortlisted ? ' is-shortlisted' : ''}" data-course="${c.id}">
              <div class="p-course-top"><span class="p-tag">${c.level}</span>${flag(c.flag, 36, 24)}</div>
              <h2>${c.name}</h2>
              <p class="p-course-uni">${c.uni}</p>
              <p class="p-course-city">${c.city}, ${c.country}</p>
              <p class="p-course-by">Suggested by your counsellor</p>
              <div class="p-course-actions">
                <button type="button" class="p-btn p-btn-outline p-shortlist" data-shortlist="${c.id}" aria-pressed="${c.shortlisted ? 'true' : 'false'}">${icon('bookmark', 16)}<span class="p-shortlist-off">Shortlist</span><span class="p-shortlist-on">Shortlisted</span><span class="sr-only"> ${c.name}</span></button>
                <a class="p-btn p-btn-navy" href="apply.html#courses" data-apply-course="${c.id}">Apply<span class="sr-only"> for ${c.name}</span></a>
              </div>
            </li>`).join('\n');
  const body = `      <div data-when="progress" class="p-stack">
        <div class="p-card p-note">
          <img src="${counsellor.photo}" alt="" width="52" height="52">
          <div><p class="p-note-title">${esc(counsellor.first)} reviewed your profile and suggested ${sample.courses.length} courses</p><p>Shortlist the ones you like, then apply. Questions? Message your counsellor any time.</p></div>
          <a class="p-btn p-btn-outline" href="${counsellor.wa(`Hello ${counsellor.first}, I have a question about my course suggestions. (Sent from the student portal)`)}" target="_blank" rel="noopener noreferrer">${icon('chat', 16)}Message ${esc(counsellor.first)}<span class="sr-only"> on WhatsApp (opens in a new tab)</span></a>
        </div>
        <div class="p-tabs" role="tablist" aria-label="Courses">
          <button type="button" role="tab" id="tab-suggested" aria-selected="true" aria-controls="course-panel" data-course-filter="all">Suggested for you <span class="p-tab-count">${sample.courses.length}</span></button>
          <button type="button" role="tab" id="tab-shortlisted" aria-selected="false" aria-controls="course-panel" data-course-filter="shortlisted" tabindex="-1">Shortlisted <span class="p-tab-count" data-shortlist-count>${shortlisted}</span></button>
        </div>
        <div id="course-panel" role="tabpanel" aria-labelledby="tab-suggested">
          <ul class="p-courses" data-filter="all">
${cards}
          </ul>
          <p class="p-card p-courses-none" hidden>You haven&rsquo;t shortlisted any courses yet. Press <strong>Shortlist</strong> on a suggestion to keep it here.</p>
        </div>
      </div>
      <div data-when="new">
        ${empty('book', 'No course suggestions yet', 'Complete your profile and our team of experts will evaluate it and suggest courses for you.', `<a class="p-btn p-btn-gold" href="apply.html">Complete my profile</a>`)}
      </div>`;
  return shell({ slug: 'courses', title: 'Course suggestions', heading: 'Course suggestions', sub: 'Courses our team picked for you, and the ones you&rsquo;ve shortlisted.', body });
}

// ---- apply: the form ----
const req = '<span class="p-req" aria-hidden="true">*</span>';
const field = (name, label, { type = 'text', required = true, span = 1, placeholder = '', options, auto } = {}) => {
  const attrs = `name="${name}" id="f-${name}"${required ? ' required' : ''}${auto ? ` autocomplete="${auto}"` : ''}`;
  let control;
  if (options) {
    control = `<select ${attrs}><option value="">${placeholder || 'Select'}</option>${options.map(o => `<option>${o}</option>`).join('')}</select>`;
  } else if (type === 'textarea') {
    control = `<textarea ${attrs} rows="3"${placeholder ? ` placeholder="${placeholder}"` : ''}></textarea>`;
  } else {
    control = `<input type="${type}" ${attrs}${placeholder ? ` placeholder="${placeholder}"` : ''}>`;
  }
  return `<div class="p-field p-span-${span}"><label for="f-${name}">${label}${required ? ' ' + req : ''}</label>${control}</div>`;
};
const choice = (name, label, opts, { required = true, span = 1 } = {}) => `<fieldset class="p-field p-span-${span}"><legend>${label}${required ? ' ' + req : ''}</legend><div class="p-choices">${opts.map((o, i) => `<label class="p-choice"><input type="radio" name="${name}" value="${o}"${required && i === 0 ? ' required' : ''}><span>${o}</span></label>`).join('')}</div></fieldset>`;

const COUNTRIES = ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'South Sudan', 'Ethiopia', 'Other'];
const DESTINATIONS = ['Australia', 'United Kingdom', 'Germany', 'Canada', 'Ireland', 'New Zealand', 'Not sure yet'];
const LEVELS = ['Certificate', 'Diploma', 'Undergraduate (Bachelor&rsquo;s)', 'Postgraduate (Master&rsquo;s)', 'Doctorate (PhD)'];
const QUALIFICATIONS = ['KCSE (secondary school)', 'Certificate', 'Diploma', 'Bachelor&rsquo;s degree', 'Master&rsquo;s degree', 'Other'];

const addressFields = p => [
  field(`${p}_country`, 'Country', { options: COUNTRIES, auto: 'country-name' }),
  field(`${p}_county`, 'County or state', { auto: 'address-level1' }),
  field(`${p}_town`, 'City or town', { auto: 'address-level2' }),
  field(`${p}_street`, 'Street address', { span: 2, auto: 'street-address' }),
  field(`${p}_postcode`, 'Postal code', { required: false, auto: 'postal-code' }),
].join('\n');

const SECTIONS = [
  ['personal', 'Personal info', `<div class="p-field p-span-3 p-photo-row">
                    <span class="p-photo-preview">${icon('user', 30)}<img alt="" hidden></span>
                    <div><label class="p-btn p-btn-outline p-file-btn">${icon('upload', 16)}Upload passport photo<input type="file" accept="image/jpeg" data-photo-input class="sr-only"></label><p class="p-hint">JPG or JPEG, up to 2MB</p></div>
                  </div>
                  ${field('first_name', 'First name', { auto: 'given-name' })}
                  ${field('middle_name', 'Middle name', { required: false, auto: 'additional-name' })}
                  ${field('last_name', 'Last name', { auto: 'family-name' })}
                  ${choice('gender', 'Gender', ['Male', 'Female'])}
                  ${choice('marital', 'Marital status', ['Single', 'Married'])}
                  ${field('dob', 'Date of birth', { type: 'date', auto: 'bday' })}
                  ${field('nationality', 'Nationality', { options: COUNTRIES })}
                  ${field('citizenship', 'Citizenship', { options: COUNTRIES })}
                  ${field('education_country', 'Country of education', { options: COUNTRIES })}
                  ${field('education_level', 'Highest level of education', { options: QUALIFICATIONS, placeholder: 'Select qualification' })}`],
  ['plans', 'Study plans', `${field('plan_country', 'Where would you like to study?', { options: DESTINATIONS })}
                  ${field('plan_level', 'Level of study', { options: LEVELS })}
                  ${field('plan_intake', 'Preferred intake', { options: ['January 2027', 'May 2027', 'September 2027', 'January 2028', 'Not sure yet'] })}
                  ${field('plan_field', 'Field of study', { span: 2, placeholder: 'For example, Nursing or Business' })}
                  ${field('plan_budget', 'Yearly budget (KES)', { required: false, type: 'number', placeholder: 'Optional' })}`],
  ['current_address', 'Current address', addressFields('cur')],
  ['passport', 'Passport information', `${field('passport_no', 'Passport number')}
                  ${field('passport_country', 'Issuing country', { options: COUNTRIES })}
                  ${field('passport_issued', 'Date of issue', { type: 'date' })}
                  ${field('passport_expires', 'Expiry date', { type: 'date' })}
                  <p class="p-hint p-span-2 p-hint-box">No passport yet? Leave this for now and ask your counsellor; we&rsquo;ll guide you through applying for one.</p>`],
  ['permanent_address', 'Permanent address', addressFields('perm')],
  ['nationality_info', 'Nationality', `${field('birth_country', 'Country of birth', { options: COUNTRIES })}
                  ${field('birth_place', 'Place of birth')}
                  ${field('other_citizenship', 'Any other citizenship?', { required: false, placeholder: 'Leave blank if none' })}`],
  ['background', 'Background info', `${choice('refused', 'Have you ever been refused a visa?', ['No', 'Yes'], { span: 3 })}
                  ${choice('abroad', 'Have you studied or travelled abroad before?', ['No', 'Yes'], { span: 3 })}
                  ${choice('english_test', 'English test', ['IELTS', 'PTE', 'Not taken yet'], { span: 3 })}
                  ${field('background_notes', 'Anything else we should know?', { type: 'textarea', required: false, span: 3, placeholder: 'For example, a medical condition or a gap in your studies' })}`],
  ['emergency', 'Emergency contacts', `${field('em_name', 'Full name')}
                  ${field('em_relation', 'Relationship', { options: ['Parent', 'Guardian', 'Sibling', 'Spouse', 'Other relative', 'Friend'] })}
                  ${field('em_phone', 'Phone number', { type: 'tel', placeholder: '07XX XXX XXX' })}
                  ${field('em_email', 'Email address', { type: 'email', required: false, span: 2 })}`],
];

const DOCUMENTS = [
  ['passport_bio', 'Passport bio page', 'The page with your photo and details', true],
  ['passport_photo', 'Passport photo', 'JPG, white background', true],
  ['kcse_cert', 'KCSE certificate', '', true],
  ['kcse_slip', 'KCSE result slip', '', true],
  ['completion_letter', 'School Completion Letter', 'Canberra Institute of Technology is waiting for this', false],
  ['transcripts', 'Academic transcripts', 'From any college or university you attended', true],
  ['cv', 'CV', 'Our CV template is in Resources', true],
  ['sop', 'Statement of purpose', 'Our guide is in Resources', false],
  ['sponsor_letter', 'Sponsorship letter', 'Signed by whoever is paying your fees', false],
];

function apply() {
  const sections = SECTIONS.map(([id, label, fields], i) => `          <section class="p-card p-acc" data-section="${id}">
            <h2><button type="button" class="p-acc-btn" aria-expanded="${i === 0 ? 'true' : 'false'}" aria-controls="acc-${id}"><span class="p-acc-num" aria-hidden="true"><span class="p-acc-n">${i + 1}</span>${icon('check', 14)}</span><span class="p-acc-title">${label}</span><span class="p-acc-state" data-state-text>Not started</span>${icon('chevron', 18, 'p-acc-chev')}</button></h2>
            <div class="p-acc-body" id="acc-${id}"${i === 0 ? '' : ' hidden'}>
              <div class="p-grid">
                  ${fields}
              </div>
            </div>
          </section>`).join('\n');

  const prefs = [1, 2, 3].map(n => `            <fieldset class="p-card p-pref">
              <legend>Preference ${n}${n === 1 ? ' ' + req : ' <span class="p-optional">(optional)</span>'}</legend>
              <div class="p-grid">
                ${field(`pref${n}_country`, 'Country', { options: DESTINATIONS.slice(0, 6), required: n === 1 })}
                ${field(`pref${n}_level`, 'Level', { options: LEVELS, required: n === 1 })}
                ${field(`pref${n}_intake`, 'Intake', { options: ['January 2027', 'May 2027', 'September 2027', 'January 2028'], required: n === 1 })}
                ${field(`pref${n}_course`, 'Course', { span: 2, required: n === 1, placeholder: 'For example, Bachelor of Nursing' })}
                ${field(`pref${n}_uni`, 'University or college', { required: false, placeholder: 'If you have one in mind' })}
              </div>
            </fieldset>`).join('\n');

  const docs = DOCUMENTS.map(([id, name, hint, sampleDone]) => `            <li class="p-doc"${sampleDone ? ' data-sample-done' : ''} data-doc="${id}">
              <span class="p-doc-icon">${icon('file', 20)}</span>
              <div class="p-doc-text"><p class="p-doc-name">${name}</p>${hint ? `<p class="p-doc-hint">${hint}</p>` : ''}<p class="p-doc-file" hidden></p></div>
              <span class="p-status p-status-green p-doc-done">Uploaded</span>
              <span class="p-status p-status-due p-doc-todo">Needed</span>
              <span class="p-status p-status-blue p-doc-picked" hidden>Selected</span>
              <label class="p-btn p-btn-outline p-file-btn">${icon('upload', 16)}<span class="p-doc-btn-text">Upload</span><span class="sr-only"> ${name}</span><input type="file" class="sr-only" accept=".pdf,.jpg,.jpeg,.png" data-doc-input></label>
            </li>`).join('\n');

  const body = `      <div class="p-apply">
        <div class="p-apply-steps" role="tablist" aria-label="Application steps">
          <button type="button" role="tab" id="step-profile" aria-controls="panel-profile" aria-selected="true" data-step="profile"><span class="p-apply-step-num">1</span><span><span class="p-apply-step-name">Profile</span><span class="p-apply-step-state" data-step-state="profile">Not started</span></span></button>
          <button type="button" role="tab" id="step-courses" aria-controls="panel-courses" aria-selected="false" data-step="courses" tabindex="-1"><span class="p-apply-step-num">2</span><span><span class="p-apply-step-name">Course preferences</span><span class="p-apply-step-state" data-step-state="courses">Not started</span></span></button>
          <button type="button" role="tab" id="step-documents" aria-controls="panel-documents" aria-selected="false" data-step="documents" tabindex="-1"><span class="p-apply-step-num">3</span><span><span class="p-apply-step-name">Documents</span><span class="p-apply-step-state" data-step-state="documents">Not started</span></span></button>
        </div>
        <div class="p-apply-grid">
          <form class="p-apply-form" id="apply-form" novalidate>
            <div class="p-stack" role="tabpanel" id="panel-profile" aria-labelledby="step-profile">
${sections}
              <div class="p-form-foot"><button type="button" class="p-btn p-btn-outline" data-save-draft>Save draft</button><button type="button" class="p-btn p-btn-navy" data-go-step="courses">${icon('arrow', 16)}Next: Course preferences</button></div>
            </div>
            <div class="p-stack" role="tabpanel" id="panel-courses" aria-labelledby="step-courses" hidden>
              <p class="p-card p-intro">Tell us up to three courses you&rsquo;d like to apply for. Not sure yet? Fill in what you know, or pick from the <a href="courses.html">courses your counsellor suggested</a>.</p>
${prefs}
              <div class="p-form-foot"><button type="button" class="p-btn p-btn-outline" data-go-step="profile">Back</button><span class="p-form-foot-right"><button type="button" class="p-btn p-btn-outline" data-save-draft>Save draft</button><button type="button" class="p-btn p-btn-navy" data-go-step="documents">${icon('arrow', 16)}Next: Documents</button></span></div>
            </div>
            <div class="p-stack" role="tabpanel" id="panel-documents" aria-labelledby="step-documents" hidden>
              <section class="p-card p-docs" aria-labelledby="docs-title">
                <div class="p-card-head"><h2 id="docs-title">Your documents</h2><span class="p-muted" data-docs-count></span></div>
                <p class="p-muted">PDF, JPG or PNG, up to 5MB each. Templates for the letters are in <a href="resources.html">Resources</a>.</p>
                <ul class="p-doc-list">
${docs}
                </ul>
              </section>
              <div class="p-form-foot"><button type="button" class="p-btn p-btn-outline" data-go-step="courses">Back</button><span class="p-form-foot-right"><button type="button" class="p-btn p-btn-outline" data-save-draft>Save draft</button><button type="button" class="p-btn p-btn-gold" data-toast="Submitting isn&rsquo;t connected yet: this is a preview. Your counsellor will submit your application with you.">Submit application</button></span></div>
            </div>
          </form>
          <aside class="p-stack p-apply-side" aria-label="Your progress">
            <section class="p-card p-progress" aria-labelledby="progress-title">
              <span class="p-eyebrow" id="progress-title">Application progress</span>
              <p class="p-progress-value"><span data-progress-pct>0%</span> <span class="p-progress-of">of your profile</span></p>
              <span class="p-bar"><span class="p-bar-fill" data-progress-bar></span></span>
              <p class="p-progress-saved">${icon('check', 14)}<span data-saved-text>Saved on this device as you type</span></p>
            </section>
            <section class="p-card p-need" aria-labelledby="need-title">
              <h2 id="need-title">What you&rsquo;ll need</h2>
              <ul data-need="profile">
                <li>${icon('file', 16)}A passport photo (JPG, up to 2MB)</li>
                <li>${icon('file', 16)}Your passport details</li>
                <li>${icon('file', 16)}Your highest education certificate</li>
                <li>${icon('file', 16)}An emergency contact</li>
              </ul>
              <ul data-need="courses" hidden>
                <li>${icon('file', 16)}The countries you&rsquo;re interested in</li>
                <li>${icon('file', 16)}The level and course you want</li>
                <li>${icon('file', 16)}When you&rsquo;d like to start</li>
              </ul>
              <ul data-need="documents" hidden>
                <li>${icon('file', 16)}Scans or clear photos of each document</li>
                <li>${icon('file', 16)}Letters filled in from our templates</li>
              </ul>
            </section>
            ${counsellorCard()}
          </aside>
        </div>
      </div>`;
  return shell({ slug: 'apply', title: 'Apply to study abroad', heading: 'Apply to study abroad', sub: 'Fill in your profile and education details. You can save and come back any time.', body });
}

function applications() {
  const STAGES = ['Submitted', 'Under review', 'Offer received', 'Offer accepted'];
  const cards = sample.applications.map(a => {
    const c = courseById[a.course];
    return `        <section class="p-card p-track" aria-label="${c.name}, ${c.uni}">
          <dl class="p-track-top">
            <div><dt>ID</dt><dd class="p-strong">#${a.id}</dd></div>
            <div><dt>Country</dt><dd class="p-strong p-with-flag">${flag(c.flag, 26, 17)}${c.country}</dd></div>
            <div class="p-track-details"><dt>Details</dt><dd><span class="p-strong">${c.name}</span><span class="p-muted">${c.uni} &middot; ${c.city}</span></dd></div>
            <div class="p-track-status"><dt>Status</dt><dd>${pill(a.status)}</dd></div>
          </dl>
          <ol class="p-stages" aria-label="Progress">
${STAGES.map((s, i) => `            <li class="${i <= a.stage ? 'is-done' : ''}${i === a.stage ? ' is-now' : ''}"${i === a.stage ? ' aria-current="step"' : ''}><span class="p-stage-bar"></span>${s}</li>`).join('\n')}
          </ol>${a.action ? `
          <div class="p-action">${icon('alert', 18)}<p><strong>Action needed:</strong> ${a.action}</p><a class="p-btn p-btn-navy" href="apply.html#documents">${icon('upload', 16)}Upload</a></div>` : ''}
        </section>`;
  }).join('\n');
  const body = `      <div data-when="progress" class="p-stack">
        <div class="p-stats p-stats-3">
          ${stat('list', '2', 'University applications', 'Across 1 country')}
          ${stat('check', '1', 'Offers received', 'Charles Darwin University')}
          ${stat('alert', '1', 'Action needed', 'Upload a document')}
        </div>
${cards}
      </div>
      <div data-when="new">
        ${empty('list', 'No university applications yet', 'Once you apply, you&rsquo;ll track every stage here and see what each university still needs.', `<a class="p-btn p-btn-gold" href="apply.html">Apply for study abroad</a>`)}
      </div>`;
  return shell({ slug: 'applications', title: 'Track applications', heading: 'My university applications', sub: 'Follow every application and see what each university still needs.', body });
}

const SERVICES = ['Student visa application', 'Travel and medical insurance', 'Medical appointment booking', 'Biometrics appointment', 'Discounted student air ticket', 'Pre-departure training'];

function visa() {
  const rows = sample.services.map(s => `              <tr>
                <td data-label="ID" class="p-strong">#${s.id}</td>
                <td data-label="Service" class="p-strong">${s.service}</td>
                <td data-label="Country"><span class="p-with-flag">${flag(s.flag, 26, 17)}${s.country}</span></td>
                <td data-label="Details" class="p-muted">${s.details}</td>
                <td data-label="Status" class="p-td-end">${pill(s.status)}</td>
              </tr>`).join('\n');
  const banner = `<section class="p-banner" aria-labelledby="banner-title">
          <div><h2 id="banner-title">Need help with a visa or travel?</h2><p>We guide you through insurance, medical appointments, biometrics and discounted student air tickets.</p></div>
          <button type="button" class="p-btn p-btn-gold" data-dialog-open="service-dialog">${icon('plus', 16)}Request a service</button>
        </section>`;
  const body = `      <div class="p-stack">
        ${banner}
        <section class="p-card p-table-card" aria-labelledby="svc-title" data-when="progress">
          <div class="p-card-head"><h2 id="svc-title">Visa and services applications</h2><span class="p-muted">${sample.services.length} requests</span></div>
          <table class="p-table">
            <thead><tr><th scope="col">ID</th><th scope="col">Service</th><th scope="col">Country</th><th scope="col">Details</th><th scope="col" class="p-td-end">Status</th></tr></thead>
            <tbody>
${rows}
            </tbody>
          </table>
        </section>
        <div data-when="new">
          ${empty('passport', 'No visa or service requests yet', 'When you&rsquo;re ready, we&rsquo;ll guide you through insurance, medical appointments and biometrics.', `<button type="button" class="p-btn p-btn-gold" data-dialog-open="service-dialog">Request a service</button>`)}
        </div>
      </div>`;
  const dialogs = `<dialog class="p-dialog" id="service-dialog" aria-labelledby="service-dialog-title">
  <form method="dialog" class="p-dialog-inner" data-service-form data-wa="${waDigits}" data-counsellor="${esc(counsellor.first)}">
    <div class="p-dialog-head"><h2 id="service-dialog-title">Request a service</h2><button type="submit" value="cancel" class="p-btn-round" aria-label="Close" formnovalidate>${icon('close', 18)}</button></div>
    <p class="p-muted">Choose what you need. This opens WhatsApp with a message to ${esc(counsellor.first)}, your counsellor, already written.</p>
    <fieldset class="p-field"><legend>Service ${req}</legend><div class="p-choices p-choices-stack">${SERVICES.map((s, i) => `<label class="p-choice"><input type="radio" name="service" value="${s}"${i === 0 ? ' required' : ''}><span>${s}</span></label>`).join('')}</div></fieldset>
    <div class="p-field"><label for="service-note">Anything to add?</label><textarea id="service-note" name="note" rows="3" placeholder="Optional"></textarea></div>
    <div class="p-dialog-foot"><button type="submit" value="cancel" class="p-btn p-btn-outline" formnovalidate>Cancel</button><button type="submit" value="send" class="p-btn p-btn-wa">${icon('chat', 16)}Send on WhatsApp</button></div>
  </form>
</dialog>
`;
  return shell({ slug: 'visa', title: 'Visa & services', heading: 'My visa and services', sub: 'Visa applications and the extra services you&rsquo;ve requested.', body, dialogs });
}

function fees() {
  const due = sample.invoices.filter(i => !i.paid);
  const paid = sample.invoices.filter(i => i.paid);
  const rows = sample.invoices.map(i => `              <tr data-search="${esc([i.date, i.no, kes(i.amount), i.paid ? 'paid' : 'due', i.item].join(' ').toLowerCase())}">
                <td data-label="Date">${i.date}</td>
                <td data-label="Invoice #" class="p-strong">${i.no}</td>
                <td data-label="Due amount" class="p-strong">${kes(i.amount)}</td>
                <td data-label="Status">${i.paid ? pill(['green', 'Paid']) : pill(['due', 'Due'])}</td>
                <td data-label="Actions" class="p-td-end"><span class="p-row-actions">${i.paid
                  ? `<button type="button" class="p-btn p-btn-outline p-btn-sm" data-toast="Receipts will download here once the portal is connected. For a copy now, call ${OFFICE_TEL_LABEL}.">${icon('download', 16)}Receipt<span class="sr-only"> for ${i.no}</span></button>`
                  : `<button type="button" class="p-btn p-btn-gold p-btn-sm" data-dialog-open="invoice-${i.no}">Pay now<span class="sr-only"> ${i.no}</span></button><button type="button" class="p-btn p-btn-outline p-btn-sm" data-dialog-open="invoice-${i.no}">View<span class="sr-only"> ${i.no}</span></button>`}</span></td>
              </tr>`).join('\n');
  const body = `      <div data-when="progress" class="p-stack">
        <div class="p-stats p-stats-3">
          <div class="p-card p-stat p-stat-navy"><span class="p-eyebrow p-eyebrow-gold">Outstanding</span><span class="p-stat-value">${kes(due.reduce((t, i) => t + i.amount, 0))}</span><span class="p-stat-note">${due.length} invoice &middot; due ${due[0].due}</span></div>
          ${stat('check', kes(paid.reduce((t, i) => t + i.amount, 0)), 'Paid to date', `${paid.length} invoices paid`)}
          ${stat('calendar', due[0].due.replace(/ \d{4}$/, ''), 'Next due date', `Invoice #${due[0].no}`)}
        </div>
        <section class="p-card p-table-card" aria-labelledby="inv-title">
          <div class="p-card-head"><h2 id="inv-title">My invoices</h2>
            <div class="p-search">${icon('search', 16)}<label class="sr-only" for="inv-search">Search invoices</label><input type="search" id="inv-search" placeholder="Search invoices" data-table-search="inv-table"></div>
          </div>
          <table class="p-table" id="inv-table">
            <thead><tr><th scope="col">Date</th><th scope="col">Invoice #</th><th scope="col">Due amount</th><th scope="col">Status</th><th scope="col" class="p-td-end">Actions</th></tr></thead>
            <tbody>
${rows}
              <tr class="p-table-none" hidden><td colspan="5">No invoices match your search.</td></tr>
            </tbody>
          </table>
          <div class="p-table-foot"><span data-table-count="inv-table">Showing 1 to ${sample.invoices.length} of ${sample.invoices.length} invoices</span><span>Questions about a payment? Call <a href="tel:${OFFICE_TEL}">${OFFICE_TEL_LABEL}</a></span></div>
        </section>
      </div>
      <div data-when="new">
        ${empty('receipt', 'No invoices yet', 'Invoices from Studies &amp; Awards will appear here, and you can pay and download receipts.', `<a class="p-btn p-btn-gold" href="${counsellor.wa(`Hello ${counsellor.first}, I have a question about fees. (Sent from the student portal)`)}" target="_blank" rel="noopener noreferrer">Talk to a counsellor<span class="sr-only"> on WhatsApp (opens in a new tab)</span></a>`)}
      </div>`;
  const dialogs = due.map(i => `<dialog class="p-dialog" id="invoice-${i.no}" aria-labelledby="invoice-${i.no}-title">
  <div class="p-dialog-inner">
    <div class="p-dialog-head"><h2 id="invoice-${i.no}-title">Invoice ${i.no}</h2><button type="button" class="p-btn-round" aria-label="Close" data-dialog-close>${icon('close', 18)}</button></div>
    <dl class="p-invoice">
      <div><dt>For</dt><dd>${i.item}</dd></div>
      <div><dt>Issued</dt><dd>${i.date}</dd></div>
      <div><dt>Due</dt><dd>${i.due}</dd></div>
      <div class="p-invoice-total"><dt>Amount due</dt><dd>${kes(i.amount)}</dd></div>
    </dl>
    <p class="p-hint-box">Paying online isn&rsquo;t connected yet: this is a preview. To pay now, call <a href="tel:${OFFICE_TEL}">${OFFICE_TEL_LABEL}</a> or message your counsellor for payment details.</p>
    <div class="p-dialog-foot"><button type="button" class="p-btn p-btn-outline" data-dialog-close>Close</button><a class="p-btn p-btn-wa" href="${counsellor.wa(`Hello ${counsellor.first}, I'd like to pay invoice ${i.no} (${kes(i.amount)}). Could you send me the payment details? (Sent from the student portal)`)}" target="_blank" rel="noopener noreferrer">${icon('chat', 16)}Ask for payment details<span class="sr-only"> on WhatsApp (opens in a new tab)</span></a></div>
  </div>
</dialog>
`).join('');
  return shell({ slug: 'fees', title: 'Fees', heading: 'My invoices', sub: 'Your invoices, payments and receipts.', body, dialogs });
}

function resourcesPage() {
  const cats = resources.map(([name, , files], i) => `          <button type="button" class="p-cat" role="tab" id="cat-${i}" aria-controls="catp-${i}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''}>${icon('folder', 20)}<span><span class="p-cat-name">${name}</span><span class="p-cat-count">${files.length} ${files.length === 1 ? 'file' : 'files'}</span></span></button>`).join('\n');
  const panels = resources.map(([name, note, files], i) => `        <section class="p-card p-files" role="tabpanel" id="catp-${i}" aria-labelledby="cat-${i}"${i ? ' hidden' : ''}>
          <div class="p-files-head"><h2>${name}</h2><p class="p-muted">${files.length} ${files.length === 1 ? 'file' : 'files'} &middot; ${note}</p></div>
          <ul>
${files.map(f => `            <li><span class="p-doc-icon">${icon('file', 20)}</span><span class="p-files-name">${f[0]}</span>${resourceLink(f, 'p-btn p-btn-outline p-btn-sm')}${icon('download', 16)}Download<span class="sr-only"> ${f[0]}</span></a></li>`).join('\n')}
          </ul>
        </section>`).join('\n');
  const body = `      <div class="p-resources">
        <div class="p-cats">
          <p class="p-eyebrow" id="cats-label">Categories</p>
          <div role="tablist" aria-labelledby="cats-label" aria-orientation="vertical" class="p-cats-list">
${cats}
          </div>
        </div>
        <div>
${panels}
        </div>
      </div>`;
  return shell({ slug: 'resources', title: 'Resources', heading: 'Resources', sub: 'Templates and forms for your application, sponsors and visa.', body });
}

function account() {
  const body = `      <div class="p-account">
        <div class="p-stack">
          <section class="p-card p-profile" aria-label="Profile photo">
            <span class="p-profile-avatar"><span data-avatar-initials>${sample.initials}</span><img alt="" hidden data-avatar-img></span>
            <p class="p-profile-name">${sample.first} ${sample.last}</p>
            <p class="p-muted">Student &middot; ${sample.place}</p>
            <label class="p-btn p-btn-outline p-file-btn">${icon('upload', 16)}Change photo<input type="file" accept="image/*" class="sr-only" data-avatar-input></label>
          </section>
          <section class="p-card p-security" aria-labelledby="sec-title">
            <h2 id="sec-title">${icon('lock', 18, 'p-i-gold')}Password &amp; security</h2>
            <p class="p-muted">Change your password regularly to keep your application safe.</p>
            <button type="button" class="p-btn p-btn-navy p-btn-block" data-dialog-open="password-dialog">Change password</button>
          </section>
        </div>
        <form class="p-card p-basic" aria-labelledby="basic-title" data-account-form novalidate>
          <h2 id="basic-title">Basic info</h2>
          <div class="p-grid p-grid-2">
            ${choice('acc_gender', 'Gender', ['Male', 'Female'], { span: 2, required: false })}
            <div class="p-field"><label for="acc-first">First name ${req}</label><input id="acc-first" name="first" required value="${sample.first}" autocomplete="given-name"></div>
            <div class="p-field"><label for="acc-middle">Middle name</label><input id="acc-middle" name="middle" placeholder="Middle name" autocomplete="additional-name"></div>
            <div class="p-field"><label for="acc-last">Last name ${req}</label><input id="acc-last" name="last" required value="${sample.last}" autocomplete="family-name"></div>
            <div class="p-field"><label for="acc-email">E-mail address ${req}</label><input id="acc-email" name="email" type="email" required placeholder="you@example.com" autocomplete="email"></div>
            <div class="p-field"><label for="acc-mobile">Mobile no. ${req}</label><span class="p-prefix"><span>+254</span><input id="acc-mobile" name="mobile" type="tel" required placeholder="7XX XXX XXX" autocomplete="tel-national"></span></div>
            <div class="p-field"><label for="acc-wa">WhatsApp</label><span class="p-prefix"><span>+254</span><input id="acc-wa" name="whatsapp" type="tel" placeholder="7XX XXX XXX"></span></div>
            <div class="p-field p-span-2"><label for="acc-country">Country of residence ${req}</label><select id="acc-country" name="country" required>${COUNTRIES.map(c => `<option${c === 'Kenya' ? ' selected' : ''}>${c}</option>`).join('')}</select></div>
          </div>
          <div class="p-form-foot p-form-foot-end"><button type="reset" class="p-btn p-btn-outline">Cancel</button><button type="submit" class="p-btn p-btn-navy">Save changes</button></div>
        </form>
      </div>`;
  const dialogs = `<dialog class="p-dialog" id="password-dialog" aria-labelledby="password-dialog-title">
  <form class="p-dialog-inner" data-password-form novalidate>
    <div class="p-dialog-head"><h2 id="password-dialog-title">Change password</h2><button type="button" class="p-btn-round" aria-label="Close" data-dialog-close>${icon('close', 18)}</button></div>
    <div class="p-field"><label for="pw-current">Current password ${req}</label><input id="pw-current" type="password" required autocomplete="current-password"></div>
    <div class="p-field"><label for="pw-new">New password ${req}</label><input id="pw-new" type="password" required minlength="8" autocomplete="new-password" aria-describedby="pw-hint"><p class="p-hint" id="pw-hint">At least 8 characters.</p></div>
    <div class="p-field"><label for="pw-confirm">Confirm new password ${req}</label><input id="pw-confirm" type="password" required autocomplete="new-password"></div>
    <p class="p-form-error" role="alert" hidden></p>
    <div class="p-dialog-foot"><button type="button" class="p-btn p-btn-outline" data-dialog-close>Cancel</button><button type="submit" class="p-btn p-btn-navy">Update password</button></div>
  </form>
</dialog>
`;
  return shell({ slug: 'account', title: 'My account', heading: 'My account', sub: 'Your profile, contact details and password.', body, dialogs });
}

function signIn() {
  const points = [['pen', 'Apply to study abroad and upload your documents'], ['list', 'Track your university and visa applications'], ['book', 'See the courses our counsellors suggest for you'], ['download', 'Download templates and pay your fees']];
  return `${head('Sign in')}
<body class="p-signin-body">
<div class="p-signin">
  <section class="p-signin-art" aria-label="About the student portal">
    ${brand('../index.html', true)}
    <p class="p-signin-title">Your study abroad journey, in one place.</p>
    <ul class="p-signin-points">
${points.map(([ic, t]) => `      <li><span>${icon(ic, 17)}</span>${t}</li>`).join('\n')}
    </ul>
    <p class="p-signin-contact"><a href="tel:${OFFICE_TEL}">${icon('phone', 16)}${OFFICE_TEL_LABEL}</a><span class="p-dot" aria-hidden="true"></span><a href="mailto:${OFFICE_MAIL}">${icon('mail', 16)}${OFFICE_MAIL}</a></p>
  </section>
  <main class="p-signin-main" id="p-content">
    <div class="p-signin-tools">
      ${themeToggle('      ')}
    </div>
    <form class="p-signin-form" data-signin-form novalidate>
      <div>
        <h1>Sign in</h1>
        <p class="p-muted">Use the email and password your counsellor gave you.</p>
      </div>
      <p class="p-preview-note">Preview: sign-in isn&rsquo;t connected yet. Any email and password opens the portal with sample data.</p>
      <div class="p-field"><label for="si-email">Email address</label><input id="si-email" type="email" name="email" required placeholder="you@example.com" autocomplete="email"></div>
      <div class="p-field"><label for="si-password">Password</label><input id="si-password" type="password" name="password" required placeholder="Your password" autocomplete="current-password"></div>
      <p class="p-form-error" role="alert" hidden></p>
      <div class="p-signin-row"><label class="p-check"><input type="checkbox" name="remember">Remember me</label><button type="button" class="p-link-gold" aria-expanded="false" aria-controls="forgot-help" data-forgot>Forgot password?</button></div>
      <p class="p-hint-box" id="forgot-help" hidden>Your counsellor can reset it for you. Call <a href="tel:${OFFICE_TEL}">${OFFICE_TEL_LABEL}</a> or email <a href="mailto:${OFFICE_MAIL}?subject=Student%20portal%20password%20reset">${OFFICE_MAIL}</a>.</p>
      <button type="submit" class="p-btn p-btn-navy p-btn-block p-btn-lg">Sign in</button>
      <p class="p-signin-help">Your account is set up by your Studies &amp; Awards counsellor. Don&rsquo;t have your login details? Call <a href="tel:${OFFICE_TEL}">${OFFICE_TEL_LABEL}</a> or email <a href="mailto:${OFFICE_MAIL}">${OFFICE_MAIL}</a>.</p>
      <a class="p-back" href="../index.html">&larr; Back to the main website</a>
    </form>
  </main>
</div>
<script src="../js/theme.js"></script>
<script src="../js/portal.js"></script>
</body>
</html>
`;
}

const outputs = [
  ['index.html', signIn()],
  ['dashboard.html', dashboard()],
  ['courses.html', courses()],
  ['apply.html', apply()],
  ['applications.html', applications()],
  ['visa.html', visa()],
  ['fees.html', fees()],
  ['resources.html', resourcesPage()],
  ['account.html', account()],
];

const args = process.argv.slice(2);
if (args.includes('--check')) {
  const drifted = outputs.filter(([rel, content]) => {
    const file = join(outRoot, rel);
    return !existsSync(file) || readFileSync(file, 'utf8') !== content;
  });
  if (drifted.length) {
    console.error('Out of date (hand-edited, or the generator is behind):\n  ' + drifted.map(([rel]) => 'portal/' + rel).join('\n  '));
    process.exit(1);
  }
  console.log(`All ${outputs.length} portal pages match the generator.`);
} else {
  mkdirSync(outRoot, { recursive: true });
  for (const [rel, content] of outputs) {
    writeFileSync(join(outRoot, rel), content, 'utf8');
    console.log('wrote', resolve(outRoot, rel));
  }
}
