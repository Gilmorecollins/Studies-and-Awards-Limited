import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

// Resolve paths relative to this script's location, not the caller's cwd,
// so `node tools/generate-countries.mjs` works the same from anywhere.
const __dirname = dirname(fileURLToPath(import.meta.url));
const siteDir = join(__dirname, '..', 'site');

const checkIcon = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#8A6600" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0;margin-top:2px;"><path d="M5 12.5l4.5 4.5L19 7"/></svg>`;

const PLACEHOLDER_SLOTS = 3;

const whyIcons = [
  `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#001B5E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5C4 4.67 4.67 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z"/><path d="M20 5.5c0-.83-.67-1.5-1.5-1.5H13v16h5.5c.83 0 1.5-.67 1.5-1.5v-13Z"/><path d="M11 4v16"/></svg>`,
  `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#001B5E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12.5 20 5l-4.5 17-3.5-7-7-2.5Z"/><path d="M12 15l-3-2.5"/></svg>`,
  `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#001B5E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 15.5H6l-2 2V8.5C4 7.12 5.12 6 6.5 6h7C14.88 6 16 7.12 16 8.5v3c0 1.38-1.12 2.5-2.5 2.5H8Z"/><path d="M14 9h3.5c1.38 0 2.5 1.12 2.5 2.5V18l-2-2h-4"/></svg>`,
  `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#001B5E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.3 3.8 5.3 3.8 8.5s-1.3 6.2-3.8 8.5c-2.5-2.3-3.8-5.3-3.8-8.5S9.5 5.8 12 3.5Z"/></svg>`,
];

const countries = [
  {
    slug: 'australia',
    name: 'Australia',
    code: 'SYD',
    welcome: 'The Land Down Under',
    tagline: 'World-class universities and a relaxed, multicultural lifestyle — we guide you from application to arrival.',
    why: [
      ['World-ranked universities', 'A wide range of internationally recognised degree programs across every discipline.'],
      ['Post-study work pathways', 'Many graduates are eligible to stay on and gain local work experience after their studies.'],
      ['Multicultural cities', 'Welcoming, diverse communities with a high standard of living.'],
      ['English-taught programs', 'No language barrier for Kenyan students entering the classroom.'],
    ],
    areas: ['Business & Management', 'Engineering', 'Health Sciences', 'Information Technology', 'Hospitality & Tourism'],
    visa: 'Studying in Australia generally requires a student visa, proof of enrolment, evidence of financial capacity, overseas student health cover, and an accepted English test score such as IELTS or PTE.',
    visaNote: 'Current visa subclass, fees, and financial thresholds — confirm exact requirements with a Studies &amp; Awards counsellor, as these are set by the Australian government and change periodically.',
    partners: [
      { city: 'Sydney', photo: 'assets/destinations/australia/sydney.jpg', fact: 'Home to the iconic Sydney Opera House, a UNESCO World Heritage Site with over one million roof tiles.' },
      { city: 'Melbourne', photo: 'assets/destinations/australia/melbourne.jpg', fact: 'Long ranked among the world\'s most liveable cities, known for its laneway cafés and arts scene.' },
      { city: 'Brisbane', photo: 'assets/destinations/australia/brisbane.jpg', fact: 'Australia\'s third most populous city, set on the winding Brisbane River.' },
      { city: 'Perth', photo: 'assets/destinations/australia/perth.jpg', fact: 'One of the most geographically isolated major cities in the world, with vast desert to its east.' },
      { city: 'Adelaide', photo: 'assets/destinations/australia/adelaide.jpg', fact: 'Known as the "City of Churches," with more places of worship per capita than any other Australian city.' },
      { city: 'Gold Coast', photo: 'assets/destinations/australia/gold-coast.jpg', fact: 'Famous for its golden beaches and Australia\'s largest cluster of theme parks.' },
      { city: 'Canberra', photo: 'assets/destinations/australia/canberra.jpg', fact: 'Chosen in 1908 as a purpose-built capital — a compromise between rival cities Sydney and Melbourne.' },
      { city: 'Darwin', photo: 'assets/destinations/australia/darwin.jpg', fact: 'Australia\'s tropical capital of the north, closer to Jakarta than to Canberra.' },
      { city: 'Hobart', photo: 'assets/destinations/australia/hobart.jpg', fact: 'Australia\'s second-oldest capital city, founded in 1804 on the Derwent River.' },
    ],
  },
  {
    slug: 'united-kingdom',
    name: 'United Kingdom',
    code: 'LHR',
    welcome: 'Home of Timeless Tradition',
    tagline: 'World-renowned universities and a rich academic tradition, with a route to work after you graduate.',
    why: [
      ['World-renowned universities', 'Home to some of the world\'s oldest and most respected universities, offering globally recognised degrees.'],
      ['Graduate visa route', 'Eligible graduates can apply for a post-study Graduate visa to live and work in the UK after completing their degree.'],
      ['Shorter degree programs', 'Many undergraduate degrees run three years and taught master\'s degrees just one, reducing overall time and cost.'],
      ['Rich academic tradition', 'Multicultural cities with centuries of academic history and a huge range of course specialisations.'],
    ],
    areas: ['Business & Management', 'Law', 'Engineering', 'Health Sciences', 'Computer Science'],
    visa: 'Studying in the UK generally requires a Student visa, an offer from a licensed student sponsor, proof of financial means to cover tuition and living costs, and an accepted English test score.',
    visaNote: 'Current visa fees, financial-evidence thresholds, and the Immigration Health Surcharge — confirm exact requirements with a Studies &amp; Awards counsellor, as these are set by UK Visas and Immigration and change periodically.',
    partners: [
      { city: 'London', photo: 'assets/destinations/united-kingdom/london.jpg', fact: 'Home to more than 170 museums, many of which — including the British Museum — offer free admission.' },
      { city: 'Edinburgh', photo: 'assets/destinations/united-kingdom/edinburgh.jpg', fact: 'Hosts the Edinburgh Festival Fringe, the largest annual arts festival in the world.' },
      { city: 'Glasgow', photo: 'assets/destinations/united-kingdom/glasgow.jpg', fact: 'Scotland\'s largest city, celebrated for its Victorian and Art Nouveau architecture.' },
      { city: 'Birmingham', photo: 'assets/destinations/united-kingdom/birmingham.jpg', fact: 'The UK\'s second-largest city — with more miles of canal than Venice.' },
      { city: 'Leeds', photo: 'assets/destinations/united-kingdom/leeds.jpg', fact: 'One of the UK\'s largest financial centres outside London, built on a Victorian textile legacy.' },
    ],
  },
  {
    slug: 'germany',
    name: 'Germany',
    code: 'FRA',
    welcome: 'The Heart of Europe',
    tagline: 'Tuition-friendly public universities — our German Language Training gets you ready to apply.',
    why: [
      ['Low or no tuition fees', 'Most public universities charge little to no tuition for degree programs.'],
      ['Strength in engineering & research', 'A long-standing international reputation in technical and scientific fields.'],
      ['Post-study job search', 'Graduates can generally apply for an extended residence permit to search for work.'],
      ['Central European location', 'Easy access to travel, internships, and industry across the continent.'],
    ],
    areas: ['Engineering', 'Computer Science', 'Natural Sciences', 'Business Administration', 'Architecture'],
    visa: 'A German national (long-stay) student visa generally requires university admission, proof of financial resources (often via a blocked account), health insurance, and, for many programs, a German language certificate — which is what our German Language Training prepares you for.',
    visaNote: 'Current visa fees and blocked-account thresholds — confirm exact requirements with a Studies &amp; Awards counsellor, as these are set by German authorities and change periodically.',
    partners: [
      { city: 'Berlin', photo: 'assets/destinations/germany/berlin.jpg', fact: 'Germany\'s capital and largest city, reunified in 1990 and now one of Europe\'s leading centres for startups and the arts.' },
      { city: 'Munich', photo: 'assets/destinations/germany/munich.jpg', fact: 'Bavaria\'s capital, home to the world-famous Oktoberfest and some of Germany\'s top-ranked technical universities.' },
      { city: 'Hamburg', photo: 'assets/destinations/germany/hamburg.jpg', fact: 'Germany\'s second-largest city and a major port, built around more canals and bridges than Amsterdam and Venice combined.' },
      { city: 'Frankfurt', photo: 'assets/destinations/germany/frankfurt.jpg', fact: 'Continental Europe\'s financial capital, home to the European Central Bank and one of the world\'s busiest airports.' },
      { city: 'Stuttgart', photo: 'assets/destinations/germany/stuttgart.jpg', fact: 'Home to Mercedes-Benz and Porsche, at the heart of Germany\'s automotive and engineering industry.' },
      { city: 'D&uuml;sseldorf', photo: 'assets/destinations/germany/dusseldorf.jpg', fact: 'A fashion and trade-fair hub on the Rhine, home to one of Europe\'s largest Japanese communities.' },
      { city: 'Leipzig', photo: 'assets/destinations/germany/leipzig.jpg', fact: 'A historic centre of music and publishing, once home to Johann Sebastian Bach and now a fast-growing student city.' },
      { city: 'Bremen', photo: 'assets/destinations/germany/bremen.jpg', fact: 'One of Germany\'s oldest port cities, famously the setting of the Brothers Grimm tale "The Town Musicians of Bremen".' },
    ],
  },
  {
    slug: 'canada',
    name: 'Canada',
    code: 'YYZ',
    welcome: 'The Great White North',
    tagline: 'Welcoming pathways to study and, for many graduates, to stay on and work.',
    why: [
      ['Globally respected degrees', 'Recognised qualifications across every field of study.'],
      ['Post-Graduation Work Permit', 'Many international graduates are eligible to work in Canada after their studies.'],
      ['Multicultural, high quality of life', 'Welcoming cities that regularly rank among the most liveable in the world.'],
      ['A pathway toward residence', 'Study and work experience can open routes toward permanent residence for eligible graduates.'],
    ],
    areas: ['Business & Management', 'Engineering & Technology', 'Health Sciences', 'Hospitality', 'Information Technology'],
    visa: 'A Canadian study permit generally requires a letter of acceptance from a designated learning institution, proof of financial support, and a medical exam where applicable.',
    visaNote: 'Current study permit fees and financial-proof thresholds — confirm exact requirements with a Studies &amp; Awards counsellor, as these are set by Immigration, Refugees and Citizenship Canada and change periodically.',
    partners: [],
  },
  {
    slug: 'ireland',
    name: 'Ireland',
    code: 'DUB',
    welcome: 'The Emerald Isle',
    tagline: 'EU-recognised degrees with strong post-study work opportunities in a welcoming, English-speaking country.',
    why: [
      ['EU-recognised degrees', 'Qualifications respected across Europe and internationally.'],
      ['A hub for global employers', 'Home to the European base of many major technology and pharmaceutical companies.'],
      ['Graduate work pathways', 'Eligible graduates can apply to stay on and gain work experience after their studies.'],
      ['English-speaking campus life', 'A welcoming student culture with no language barrier.'],
    ],
    areas: ['Information Technology', 'Pharmaceutical Sciences', 'Business', 'Engineering', 'Data Science'],
    visa: 'Non-EEA students on courses longer than three months generally need an Irish study visa (Type D), a letter of acceptance, evidence of tuition payment, proof of financial resources, and private medical insurance.',
    visaNote: 'Current visa fees and financial-evidence thresholds — confirm exact requirements with a Studies &amp; Awards counsellor, as these are set by Irish immigration authorities and change periodically.',
    partners: [],
  },
];

function footerDestLinks() {
  return countries.map(c => `          <a href="${c.slug}.html">${c.name}</a>`).join('\n');
}

function page(c) {
  const whyCards = c.why.map((w, i) => `      <div class="card bullet-row" style="padding:26px;">
        <div class="icon-circle" aria-hidden="true">${whyIcons[i % whyIcons.length]}</div>
        <div><h3>${w[0]}</h3><p>${w[1]}</p></div>
      </div>`).join('\n');

  const areaChips = c.areas.map(a => `      <span class="chip">${a}</span>`).join('\n');

  const slideCount = c.partners.length > 0 ? c.partners.length : PLACEHOLDER_SLOTS;

  const cityImages = (c.partners.length > 0
    ? c.partners.map((p, i) => `      <div class="city-img" data-src="${p.photo}"${i === 0 ? ` style="background-image:url('${p.photo}');"` : ''}></div>`)
    : Array.from({ length: PLACEHOLDER_SLOTS }, () => `      <div class="city-img is-placeholder"></div>`)
  ).join('\n');

  const cityPanels = (c.partners.length > 0
    ? c.partners.map((p, i) => `      <div class="city-panel" aria-hidden="true">
        <div class="city-panel-inner">
          <div class="city-panel-index">${String(i + 1).padStart(2, '0')} / ${String(slideCount).padStart(2, '0')}</div>
          <h3 class="city-panel-name">${p.city}</h3>
          <p class="city-panel-fact">${p.fact}</p>
          <div class="city-panel-info">
            <div class="city-panel-info-label">PARTNER UNIVERSITIES</div>
            <p>[Partner universities in ${p.city} &mdash; list coming soon.]</p>
          </div>
        </div>
      </div>`)
    : Array.from({ length: PLACEHOLDER_SLOTS }, (_, i) => `      <div class="city-panel" aria-hidden="true">
        <div class="city-panel-inner">
          <div class="city-panel-index">${String(i + 1).padStart(2, '0')} / ${String(slideCount).padStart(2, '0')}</div>
          <h3 class="city-panel-name">[City]</h3>
          <p class="city-panel-fact">[A short, real fun fact about this city will go here.]</p>
          <div class="city-panel-info">
            <div class="city-panel-info-label">PARTNER UNIVERSITIES</div>
            <p>[Add a city photo, then list partner universities here.]</p>
          </div>
        </div>
      </div>`)
  ).join('\n');

  const cityDots = Array.from({ length: slideCount }, (_, i) =>
    `        <button type="button" class="city-dot" aria-label="Slide ${i + 1} of ${slideCount}"><span class="city-dot-fill"></span></button>`
  ).join('\n');

  const cityScroller = `  <section class="city-scroller" id="city-scroller" data-interval="10000" aria-label="${c.name} destination showcase" aria-roledescription="carousel">
${cityImages}
    <div class="city-scroller-vignette"></div>
    <div class="city-scroller-top-label">Welcome to ${c.name} <strong>&mdash; ${c.welcome}</strong></div>
${cityPanels}
    <div class="city-scroller-bar" role="group" aria-label="Choose a city">
${cityDots}
    </div>
    <div class="city-scroller-controls">
      <button type="button" class="city-play-toggle" aria-label="Pause slideshow">
        <svg class="icon-pause" viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
        <svg class="icon-play" viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M7 5.5v13l11-6.5-11-6.5Z"/></svg>
      </button>
    </div>
  </section>`;

  const otherCountries = countries.filter(x => x.slug !== c.slug);
  const otherPills = otherCountries.map(o => `      <a href="${o.slug}.html" class="pill-code">${o.code} &middot; ${o.name}</a>`).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Study in ${c.name} — Studies and Awards Limited</title>
<meta name="description" content="${c.tagline.replace(/"/g, '&quot;')}">
<link rel="icon" type="image/png" href="assets/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;1,500;1,600&family=Oswald:wght@400;500;600&display=swap">
<link rel="stylesheet" href="css/styles.css">
</head>
<body>

<a href="#main" class="skip-link">Skip to content</a>

<header class="site-header header-overlay">
  <div class="container">
    <a href="index.html" class="brand" aria-label="Studies and Awards home">
      <span class="brand-mark" aria-hidden="true">
        <img src="assets/logo-mark.png" alt="" width="120" height="80">
      </span>
      <span class="brand-name">Studies &amp; Awards</span>
    </a>
    <nav class="primary-nav" id="primary-nav" aria-label="Primary">
      <a href="about.html" class="nav-link">About Us</a>
      <a href="services.html" class="nav-link">Services</a>
      <a href="destinations.html" class="nav-link" aria-current="page">Destinations</a>
      <a href="team.html" class="nav-link">Team</a>
      <a href="https://student.studiesandawardsltd.com/login" class="nav-link muted">Student Portal</a>
      <a href="mailto:admissions@studiesandawardsltd.com?subject=Free%20Consultation%20Request" class="btn btn-primary nav-cta-mobile">Book Free Consultation</a>
    </nav>
    <div class="header-cta">
      <a href="mailto:admissions@studiesandawardsltd.com?subject=Free%20Consultation%20Request" class="btn btn-primary">Book Free Consultation</a>
      <button class="nav-toggle" aria-label="Open menu" aria-controls="primary-nav" aria-expanded="false">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
    </div>
  </div>
</header>

<main id="main">

${cityScroller}

  <section class="hero" style="margin-top:0;" aria-labelledby="hero-heading">
    <div class="container" style="grid-template-columns:1fr; text-align:center; padding-top:48px; padding-bottom:48px;">
      <div>
        <span class="eyebrow" style="color:#FFB800; margin-bottom:16px; display:block;">STUDY DESTINATION &middot; ${c.code}</span>
        <h1 id="hero-heading" style="font-size:46px;">Study in ${c.name}</h1>
        <p class="lead" style="margin:16px auto 30px; max-width:520px;">${c.tagline}</p>
        <div class="hero-actions" style="justify-content:center;">
          <a href="mailto:admissions@studiesandawardsltd.com?subject=Free%20Consultation%20Request%20-%20${encodeURIComponent(c.name)}" class="btn btn-primary">Book Free Consultation</a>
          <a href="destinations.html" class="btn btn-outline-w">View Other Destinations</a>
        </div>
      </div>
    </div>
  </section>

  <section class="section" style="padding-bottom:20px;" aria-labelledby="why-heading">
    <div class="container">
      <div class="section-head">
        <span class="eyebrow">WHY ${c.name.toUpperCase()}</span>
        <h2 id="why-heading">A destination built for ambitious students</h2>
      </div>
      <div class="grid-2">
${whyCards}
      </div>
    </div>
  </section>

  <section class="container section-tight" aria-labelledby="areas-heading">
    <h2 id="areas-heading" style="font-size:22px; margin-bottom:20px;">Popular study areas</h2>
    <div style="display:flex; flex-wrap:wrap; gap:12px;">
${areaChips}
    </div>
  </section>

  <section class="section-paper" aria-labelledby="visa-heading">
    <div class="container section-tight" style="display:grid; grid-template-columns:1fr 1fr; gap:56px;">
      <div>
        <div class="icon-circle" style="background:#FFFFFF; margin-bottom:20px;" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#001B5E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3.5" width="14" height="17" rx="1.5"/><circle cx="12" cy="9.5" r="2.2"/><path d="M8.5 16c.5-2 2-3 3.5-3s3 1 3.5 3"/></svg></div>
        <h2 id="visa-heading" style="font-size:22px; margin-bottom:14px;">Visa &amp; requirements</h2>
        <p style="font-size:15px; color:#333333; line-height:1.7; margin-bottom:16px;">${c.visa}</p>
        <p class="placeholder-note">[${c.visaNote}]</p>
      </div>
      <div>
        <div class="icon-circle" style="background:#FFFFFF; margin-bottom:20px;" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#001B5E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 15.5H6l-2 2V8.5C4 7.12 5.12 6 6.5 6h7C14.88 6 16 7.12 16 8.5v3c0 1.38-1.12 2.5-2.5 2.5H8Z"/><path d="M14 9h3.5c1.38 0 2.5 1.12 2.5 2.5V18l-2-2h-4"/></svg></div>
        <h2 style="font-size:22px; margin-bottom:14px;">How we help you get there</h2>
        <div class="bullet-list" style="gap:12px;">
          <div style="display:flex; align-items:flex-start; gap:14px;">${checkIcon}<span style="font-size:15px; color:#333333; line-height:1.6;">Counselling to shortlist the right course and university</span></div>
          <div style="display:flex; align-items:flex-start; gap:14px;">${checkIcon}<span style="font-size:15px; color:#333333; line-height:1.6;">IELTS/PTE preparation to meet the English requirement</span></div>
          <div style="display:flex; align-items:flex-start; gap:14px;">${checkIcon}<span style="font-size:15px; color:#333333; line-height:1.6;">Application &amp; admissions support through to your offer</span></div>
          <div style="display:flex; align-items:flex-start; gap:14px;">${checkIcon}<span style="font-size:15px; color:#333333; line-height:1.6;">Visa application guidance, step by step</span></div>
          <div style="display:flex; align-items:flex-start; gap:14px;">${checkIcon}<span style="font-size:15px; color:#333333; line-height:1.6;">Discounted student airfare when you're ready to fly</span></div>
        </div>
      </div>
    </div>
  </section>

  <section class="container section-tight next-dest-section" id="next-destination" data-current="${c.slug}" aria-label="Next destination"></section>

  <section class="container section-tight" aria-label="Other destinations">
    <h2 style="font-size:20px; margin-bottom:20px;">Other destinations</h2>
    <div style="display:flex; flex-wrap:wrap; gap:12px;">
${otherPills}
    </div>
  </section>

  <section class="cta-band on-bg" id="contact" aria-labelledby="cta-heading">
    <div class="container">
      <div>
        <h2 id="cta-heading">Ready to study in ${c.name}?</h2>
        <p>Book a free consultation, or explore our other study destinations.</p>
      </div>
      <a href="mailto:admissions@studiesandawardsltd.com?subject=Free%20Consultation%20Request%20-%20${encodeURIComponent(c.name)}" class="btn btn-primary">Book Free Consultation</a>
    </div>
  </section>

</main>

<footer class="site-footer">
  <div class="footer-card">
    <div class="footer-card-glow footer-card-glow-1" aria-hidden="true"></div>
    <div class="footer-card-glow footer-card-glow-2" aria-hidden="true"></div>
    <div class="container footer-grid">
      <div>
        <div class="footer-brand-row">
          <span class="brand-mark" aria-hidden="true">
          <img src="assets/logo-mark.png" alt="" width="120" height="80">
        </span>
          <span class="brand-name">Studies &amp; Awards</span>
        </div>
        <p class="footer-blurb">Personalised guidance from your first visit until you arrive and start life abroad.</p>
      </div>
      <nav aria-label="Quick links">
        <div class="footer-heading">QUICK LINKS</div>
        <div class="footer-links">
          <a href="index.html">Home</a>
          <a href="about.html">About Us</a>
          <a href="services.html">Services</a>
          <a href="team.html">Our Team</a>
          <a href="https://student.studiesandawardsltd.com/login">Student Portal</a>
        </div>
      </nav>
      <nav aria-label="Destinations">
        <div class="footer-heading">DESTINATIONS</div>
        <div class="footer-links">
${footerDestLinks()}
        </div>
      </nav>
      <div>
        <div class="footer-heading">CONTACT</div>
        <div class="footer-contact">
          <div class="footer-contact-row">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#B9C3E0" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.3"/></svg>
            <span>Daima Towers, Mezzanine 1, Eldoret, Kenya</span>
          </div>
          <a class="footer-contact-row" href="tel:+254721796500">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#B9C3E0" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3c0 1-.9 1.8-1.9 1.6C10.9 18.3 5.7 13.1 4.9 6.9 4.7 5.9 5 3.5 6 3.5Z"/></svg>
            <span>+254 721 796500</span>
          </a>
          <a class="footer-contact-row" href="mailto:admissions@studiesandawardsltd.com">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#B9C3E0" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><path d="M4 6.5 12 12.5 20 6.5"/></svg>
            <span>admissions@studiesandawardsltd.com</span>
          </a>
        </div>
      </div>
      <div class="footer-newsletter">
        <div class="footer-heading">GET THE LATEST</div>
        <p class="footer-newsletter-blurb">Destination updates and intake deadlines, straight to your inbox.</p>
        <form class="footer-subscribe" id="footer-subscribe-form">
          <label class="sr-only" for="footer-subscribe-email">Your email address</label>
          <input type="email" id="footer-subscribe-email" placeholder="Your email address" required>
          <button type="submit" class="btn btn-primary">Subscribe</button>
        </form>
      </div>
    </div>
    <div class="container footer-bottom">
      <a class="footer-bottom-legal" href="https://student.studiesandawardsltd.com/login">Student Portal Login</a>
      <span class="footer-bottom-copyright">&copy; <span id="current-year">2026</span> Studies and Awards Limited. All rights reserved.</span>
      <div class="footer-bottom-social">
        <a href="#" class="social-link" aria-label="Facebook"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 9h-2.5c-.83 0-1.5.67-1.5 1.5V12h4l-.5 3.5H10V21h-3v-5.5H5V12h2v-2C7 7.5 8.5 5.5 11.5 5.5H14V9Z"/></svg></a>
        <a href="#" class="social-link" aria-label="Instagram"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.2" cy="7.8" r="0.6" fill="#FFFFFF"/></svg></a>
        <a href="#" class="social-link" aria-label="YouTube"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="6" width="17" height="12" rx="2.5"/><path d="M10.5 10l4 2-4 2Z" fill="#FFFFFF" stroke="none"/></svg></a>
        <a href="#" class="social-link" aria-label="LinkedIn"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2.5"/><circle cx="8.2" cy="8.2" r="0.9" fill="#FFFFFF" stroke="none"/><path d="M7 11.5v6M12.5 17.5v-3.5c0-1.4 1-2.3 2.2-2.3 1.2 0 1.8.8 1.8 2.3v3.5M12.5 11.5v6"/></svg></a>
      </div>
    </div>
  </div>
</footer>

<script src="js/destinations-data.js"></script>
<script src="js/main.js"></script>
</body>
</html>
`;
}

// js/destinations-data.js — the registry the "next destination" boarding-pass
// card reads in the browser. Emitted from the same `countries` list so the two
// can't drift apart. Order here IS the journey order (each page suggests the
// entry after it; the last wraps to the first). name / welcome / tagline are
// used as plain text there, so keep them free of HTML entities.
function destinationsData() {
  const q = s => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const rows = countries.map(c => `  {
    slug: ${q(c.slug)},
    name: ${q(c.name)},
    code: ${q(c.code)},
    welcome: ${q(c.welcome)},
    tagline: ${q(c.tagline)}
  }`).join(',\n');

  return `// Destination registry — GENERATED by tools/generate-countries.mjs from its
// \`countries\` list. Edit the list there and re-run the script; anything changed
// here by hand will be overwritten (and \`--check\` will flag it).
//
// Shape (Destination): { slug, name, code, welcome, tagline }
//
// The ORDER is the journey order used by the "next destination" boarding-pass
// card on every destination page: each page suggests the entry after it, and
// the last wraps back round to the first.
window.DESTINATIONS = [
${rows}
];
`;
}

// Everything this script owns, as [path relative to site/, content].
const outputs = [
  ...countries.map(c => [`${c.slug}.html`, page(c)]),
  ['js/destinations-data.js', destinationsData()],
];

// CLI:
//   node tools/generate-countries.mjs               write the generated files into site/
//   node tools/generate-countries.mjs --out <dir>   write them somewhere else instead
//   node tools/generate-countries.mjs --check       change nothing; exit 1 if any generated
//                                                   file in site/ differs from what this
//                                                   script would produce (i.e. someone
//                                                   hand-edited it, or this script is behind)
const args = process.argv.slice(2);
const outFlag = args.indexOf('--out');
const outDir = outFlag > -1 ? resolve(args[outFlag + 1]) : siteDir;

if (args.includes('--check')) {
  const drifted = outputs.filter(([rel, content]) => {
    const file = join(siteDir, rel);
    return !existsSync(file) || readFileSync(file, 'utf8') !== content;
  });
  if (drifted.length) {
    console.error('Out of date (hand-edited, or the generator is behind):\n  ' + drifted.map(([rel]) => rel).join('\n  '));
    process.exit(1);
  }
  console.log(`All ${outputs.length} generated files match the generator.`);
} else {
  for (const [rel, content] of outputs) {
    const out = join(outDir, rel);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, content, 'utf8');
    console.log('wrote', out);
  }
}

export { countries, footerDestLinks };
