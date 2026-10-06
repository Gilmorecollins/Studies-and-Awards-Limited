import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import vm from 'vm';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { THEME_SCRIPT, themeToggle } from './theme-markup.mjs';

// Resolve paths relative to this script's location, not the caller's cwd,
// so `node tools/generate-countries.mjs` works the same from anywhere.
const __dirname = dirname(fileURLToPath(import.meta.url));
const siteDir = join(__dirname, '..', 'site');

// Partner institutions by country -> city -> [{ name, courses[] }]. The source
// of truth is data/partner-institutions.json; a city panel below shows a summary
// and a "View partners & courses" button for every city that has entries.
const partnerData = JSON.parse(readFileSync(join(__dirname, 'data', 'partner-institutions.json'), 'utf8')).countries;

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---- link previews (WhatsApp, Facebook, LinkedIn…) -------------------------------
// The site's public address once it has one, with no trailing slash, e.g.
// 'https://studiesandawardsltd.com'. Left blank for now: the canonical link,
// og:url and the share image all need a full web address, so they are only
// written when this is set. Everything else (title, description, card type,
// theme colour) is written either way. After setting it, run this script again.
// For now this is the test address on Vercel. When the real domain is live,
// swap it in here and run the script again.
const SITE_URL = 'https://test-studies-and-awards-limited.vercel.app';
const SITE_NAME = 'Studies and Awards Limited';
const THEME_COLOUR = '#001B5E';
const SEO_START = '<!-- seo:start, written by tools/generate-countries.mjs; edit the script, not this block -->';
const SEO_END = '<!-- seo:end -->';


// `title` and `description` must already be safe inside an HTML attribute.
function seoBlock({ title, description, path, image, imageAlt }) {
  const absolute = rel => `${SITE_URL}${rel.startsWith('/') ? '' : '/'}${rel}`;
  const lines = [
    SEO_START,
    THEME_SCRIPT,
    `<meta name="theme-color" content="${THEME_COLOUR}">`,
    '<meta property="og:type" content="website">',
    `<meta property="og:site_name" content="${SITE_NAME}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta name="twitter:card" content="${SITE_URL ? 'summary_large_image' : 'summary'}">`,
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
  ];
  if (SITE_URL) {
    lines.push(
      `<link rel="canonical" href="${absolute(path)}">`,
      `<meta property="og:url" content="${absolute(path)}">`,
      `<meta property="og:image" content="${absolute(image)}">`,
      '<meta property="og:image:width" content="1200">',
      '<meta property="og:image:height" content="630">',
      `<meta property="og:image:alt" content="${imageAlt}">`,
      `<meta name="twitter:image" content="${absolute(image)}">`,
    );
  }
  lines.push(SEO_END);
  return lines.join('\n');
}

// The hand-maintained pages: the generator only ever rewrites the marked block
// inside their <head>; everything else on those pages stays exactly as written.
const HAND_PAGES = ['index.html', 'about.html', 'services.html', 'team.html', 'location.html', 'destinations.html'];

function withSeoBlock(html, file) {
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  const description = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  if (!title || !description) throw new Error(`${file}: needs a <title> and a meta description to build link-preview tags`);
  const block = seoBlock({
    title, description,
    path: file === 'index.html' ? '/' : `/${file}`,
    image: 'assets/share/default.jpg',
    imageAlt: SITE_NAME,
  });
  const existing = /<!-- seo:start[\s\S]*?<!-- seo:end -->/;
  if (existing.test(html)) return html.replace(existing, () => block);
  if (!html.includes('</head>')) throw new Error(`${file}: no </head>`);
  return html.replace('</head>', () => `${block}\n</head>`);
}


const PLACEHOLDER_SLOTS = 3;

// "How we help you get there": the same six steps on every destination page,
// as on services.html (keep the two in step).
const HELP_STEPS = [
  'A free consultation, at our office in Eldoret or online, to choose your course and school',
  'IELTS, PTE or German classes, in class or online',
  'Documentation: the documents you need, certified and clearly scanned',
  'Verification of every document with whoever issued it',
  'Your application, offer and confirmation of enrolment',
  'Your student visa, then a discounted student flight',
];

const countries = [
  {
    slug: 'australia',
    name: 'Australia',
    code: 'SYD',
    welcome: 'The Land Down Under',
    tagline: 'World-class universities and a relaxed, multicultural lifestyle. We guide you from application to arrival.',
    facts: { intakes: 'February/March and July', language: 'IELTS, PTE or another approved English test', visa: 'Student visa (subclass 500)' },
    why: [
      ['World-ranked universities', 'A wide range of internationally recognised degree programs across every discipline.'],
      ['Practical, hands-on courses', 'Many courses combine classroom learning with practical, hands-on training.'],
      ['Multicultural cities', 'Welcoming, diverse communities with a high standard of living.'],
      ['English-taught programs', 'No language barrier for Kenyan students entering the classroom.'],
    ],
    areas: ['Business & Management', 'Engineering', 'Health Sciences', 'Information Technology', 'Hospitality & Tourism'],
    visa: 'You apply for a Student visa (subclass 500) once your education provider issues your Confirmation of Enrolment (CoE). You must also meet the Genuine Student requirement, hold Overseas Student Health Cover (OSHC) for your whole stay, show you can pay for your tuition and living costs, and give an accepted English test result such as IELTS or PTE.',
    visaChanges: 'visa subclass, fees and financial thresholds',
    visaAuthority: 'the Australian government',
    gallery: ['Melbourne', 'Brisbane', 'Hobart', 'Perth'],
    partners: [
      { city: 'Sydney', photo: 'assets/destinations/australia/sydney.jpg', fact: 'Home to the iconic Sydney Opera House, a UNESCO World Heritage Site with over one million roof tiles.' },
      { city: 'Melbourne', photo: 'assets/destinations/australia/melbourne.jpg', fact: 'Long ranked among the world\'s most liveable cities, known for its laneway cafés and arts scene.' },
      { city: 'Brisbane', photo: 'assets/destinations/australia/brisbane.jpg', fact: 'Australia\'s third most populous city, set on the winding Brisbane River.' },
      { city: 'Perth', photo: 'assets/destinations/australia/perth.jpg', fact: 'One of the most geographically isolated major cities in the world, with vast desert to its east.' },
      { city: 'Adelaide', photo: 'assets/destinations/australia/adelaide.jpg', fact: 'Known as the "City of Churches," with more places of worship per capita than any other Australian city.' },
      { city: 'Gold Coast', photo: 'assets/destinations/australia/gold-coast.jpg', fact: 'Famous for its golden beaches and Australia\'s largest cluster of theme parks.' },
      { city: 'Canberra', photo: 'assets/destinations/australia/canberra.jpg', fact: 'Chosen in 1908 as a purpose-built capital, a compromise between rival cities Sydney and Melbourne.' },
      { city: 'Darwin', photo: 'assets/destinations/australia/darwin.jpg', fact: 'Australia\'s tropical capital of the north, closer to Jakarta than to Canberra.' },
      { city: 'Hobart', photo: 'assets/destinations/australia/hobart.jpg', fact: 'Australia\'s second-oldest capital city, founded in 1804 on the Derwent River.' },
      { city: 'Townsville', photo: 'assets/destinations/australia/townsville.jpg', position: 'center bottom', fact: 'A tropical city in North Queensland, home to James Cook University and the gateway to the Great Barrier Reef and Magnetic Island.' },
    ],
  },
  {
    slug: 'united-kingdom',
    name: 'United Kingdom',
    code: 'LHR',
    welcome: 'Home of Timeless Tradition',
    tagline: 'World-renowned universities and a rich academic tradition, with degrees that often take less time than elsewhere.',
    facts: { intakes: 'Mainly September, some courses in January', language: 'IELTS or PTE (the UKVI version for some courses)', visa: 'Student visa' },
    why: [
      ['World-renowned universities', 'Home to some of the world\'s oldest and most respected universities, offering globally recognised degrees.'],
      ['A wide choice of courses', 'Thousands of courses across universities and colleges, from foundation programmes to master\'s degrees.'],
      ['Shorter degree programs', 'Many undergraduate degrees run three years and taught master\'s degrees just one, reducing overall time and cost.'],
      ['Rich academic tradition', 'Multicultural cities with centuries of academic history and a huge range of course specialisations.'],
    ],
    areas: ['Business & Management', 'Law', 'Engineering', 'Health Sciences', 'Computer Science'],
    visa: 'You apply for a Student visa once your university, a licensed student sponsor, gives you a Confirmation of Acceptance for Studies (CAS). You must show you can pay your course fees and living costs and prove your English, usually at level B2 for a degree. Applicants who live in Kenya also need a tuberculosis (TB) test certificate from an approved clinic.',
    visaChanges: 'visa fees, financial-evidence thresholds and the Immigration Health Surcharge',
    visaAuthority: 'UK Visas and Immigration',
    partners: [
      { city: 'London', photo: 'assets/destinations/united-kingdom/london.jpg', fact: 'Home to more than 170 museums, many of which offer free admission, including the British Museum.' },
      { city: 'Edinburgh', photo: 'assets/destinations/united-kingdom/edinburgh.jpg', fact: 'Hosts the Edinburgh Festival Fringe, the largest annual arts festival in the world.' },
      { city: 'Glasgow', photo: 'assets/destinations/united-kingdom/glasgow.jpg', fact: 'Scotland\'s largest city, celebrated for its Victorian and Art Nouveau architecture.' },
      { city: 'Birmingham', photo: 'assets/destinations/united-kingdom/birmingham.jpg', fact: 'The UK\'s second-largest city, with more miles of canal than Venice.' },
      { city: 'Leeds', photo: 'assets/destinations/united-kingdom/leeds.jpg', fact: 'One of the UK\'s largest financial centres outside London, built on a Victorian textile legacy.' },
      { city: 'Cambridge', photo: 'assets/destinations/united-kingdom/cambridge.jpg', fact: 'Home to the University of Cambridge, founded in 1209 and one of the oldest universities in the world.' },
      { city: 'Southampton', photo: 'assets/destinations/united-kingdom/southampton.jpg', fact: 'A major port city on the south coast, from where the RMS Titanic set sail in 1912, and home to the University of Southampton.' },
      { city: 'Norwich', photo: 'assets/destinations/united-kingdom/norwich.jpg', fact: 'A historic East Anglian city with a Norman cathedral and castle, and England\'s first UNESCO City of Literature.' },
      { city: 'Peterborough', photo: 'assets/destinations/united-kingdom/peterborough.jpg', fact: 'A cathedral city on the River Nene in the East of England, with fast rail links to London.' },
      { city: 'Belfast', photo: 'assets/destinations/united-kingdom/belfast.jpg', fact: 'The capital of Northern Ireland, where the RMS Titanic was built, now home to the Titanic Belfast visitor experience.' },
      { city: 'Londonderry', photo: 'assets/destinations/united-kingdom/londonderry.jpg', fact: 'Also known as Derry, a Northern Ireland city whose 17th-century walls are the most complete city walls in Ireland.' },
    ],
  },
  {
    slug: 'germany',
    name: 'Germany',
    code: 'FRA',
    welcome: 'The Heart of Europe',
    tagline: 'Tuition-friendly public universities. Our German Language Training gets you ready to apply.',
    facts: { intakes: 'Winter semester (September/October) and summer semester (March/April)', language: 'German (TestDaF or DSH) for German-taught courses; IELTS or TOEFL for English-taught ones', visa: 'National student visa' },
    why: [
      ['Low or no tuition fees', 'Most public universities charge little to no tuition for degree programs.'],
      ['Strength in engineering & research', 'A long-standing international reputation in technical and scientific fields.'],
      ['Courses taught in English', 'Alongside German-taught degrees, many master\'s programmes are taught in English.'],
      ['Central European location', 'Easy access to travel, exchanges and research across the continent.'],
    ],
    areas: ['Engineering', 'Computer Science', 'Natural Sciences', 'Business Administration', 'Architecture'],
    visa: 'With a letter of admission from a German university you apply for a national (long-stay) student visa. You need proof that you can pay your living costs, usually through a blocked account, health insurance, and proof of the language your course is taught in: for German-taught courses usually B2 level or above (TestDaF or DSH), which is what our German Language Training prepares you for.',
    visaChanges: 'visa fees and blocked-account thresholds',
    visaAuthority: 'German authorities',
    partners: [
      { city: 'Berlin', photo: 'assets/destinations/germany/berlin.jpg', fact: 'Germany\'s capital and largest city, reunified in 1990 and now one of Europe\'s leading centres for startups and the arts.' },
      { city: 'Munich', photo: 'assets/destinations/germany/munich.jpg', fact: 'Bavaria\'s capital, home to the world-famous Oktoberfest and some of Germany\'s top-ranked technical universities.' },
      { city: 'Hamburg', photo: 'assets/destinations/germany/hamburg.jpg', fact: 'Germany\'s second-largest city and a major port, built around more canals and bridges than Amsterdam and Venice combined.' },
      { city: 'Frankfurt', photo: 'assets/destinations/germany/frankfurt.jpg', fact: 'Continental Europe\'s financial capital, home to the European Central Bank and one of the world\'s busiest airports.' },
      { city: 'Stuttgart', photo: 'assets/destinations/germany/stuttgart.jpg', fact: 'Home to Mercedes-Benz and Porsche, at the heart of Germany\'s automotive and engineering industry.' },
      { city: 'Düsseldorf', photo: 'assets/destinations/germany/dusseldorf.jpg', fact: 'A fashion and trade-fair hub on the Rhine, home to one of Europe\'s largest Japanese communities.' },
      { city: 'Leipzig', photo: 'assets/destinations/germany/leipzig.jpg', fact: 'A historic centre of music and publishing, once home to Johann Sebastian Bach and now a fast-growing student city.' },
      { city: 'Bremen', photo: 'assets/destinations/germany/bremen.jpg', fact: 'One of Germany\'s oldest port cities, famously the setting of the Brothers Grimm tale "The Town Musicians of Bremen".' },
      { city: 'Cologne', photo: 'assets/destinations/germany/cologne.jpg', fact: 'Home to Cologne Cathedral, a UNESCO World Heritage Site that took more than 600 years to complete, on the banks of the Rhine.' },
      { city: 'Dortmund', photo: 'assets/destinations/germany/dortmund.jpg', fact: 'A former coal and steel city reinvented as a technology hub, home to TU Dortmund University and the football club Borussia Dortmund.' },
      { city: 'Heidelberg', photo: 'assets/destinations/germany/heidelberg.jpg', fact: 'Home to Germany\'s oldest university, founded in 1386, in a river valley beneath a ruined hilltop castle.' },
    ],
  },
  {
    slug: 'canada',
    name: 'Canada',
    code: 'YYZ',
    welcome: 'The Great White North',
    tagline: 'Respected colleges and universities in a safe, welcoming, multicultural country.',
    facts: { intakes: 'Mainly September and January, some courses in May', language: 'IELTS, TOEFL, PTE or CAEL, as your school requires', visa: 'Study permit' },
    why: [
      ['Globally respected degrees', 'Recognised qualifications across every field of study.'],
      ['Colleges and universities', 'Choose between career-focused college diplomas and university degrees.'],
      ['Multicultural, high quality of life', 'Welcoming cities that regularly rank among the most liveable in the world.'],
      ['Research and innovation', 'Universities known for research across science, technology and health.'],
    ],
    areas: ['Business & Management', 'Engineering & Technology', 'Health Sciences', 'Hospitality', 'Information Technology'],
    visa: 'You apply for a study permit with a letter of acceptance from a designated learning institution (DLI) and, for most students, a provincial or territorial attestation letter (PAL). You also need proof that you can pay your tuition and living costs, and a medical exam where required.',
    visaChanges: 'study permit fees and financial-proof thresholds',
    visaAuthority: 'Immigration, Refugees and Citizenship Canada',
    partners: [
      { city: 'Toronto', photo: 'assets/destinations/canada/toronto.jpg', fact: 'Canada\'s largest city, home to the 553-metre CN Tower, the world\'s tallest free-standing structure for more than 30 years.' },
      { city: 'Vancouver', photo: 'assets/destinations/canada/vancouver.jpg', fact: 'Regularly ranked among the world\'s most liveable cities, set between the Pacific Ocean and the Coast Mountains.' },
      { city: 'Montreal', photo: 'assets/destinations/canada/montreal.jpg', fact: 'One of the world\'s largest French-speaking cities, built around Mount Royal, the hill it takes its name from.' },
      { city: 'Ottawa', photo: 'assets/destinations/canada/ottawa.jpg', fact: 'Canada\'s capital, home to Parliament Hill and a Rideau Canal that becomes the world\'s largest naturally frozen skating rink each winter.' },
      { city: 'Calgary', photo: 'assets/destinations/canada/calgary.jpg', fact: 'Host of the 1988 Winter Olympics and the annual Calgary Stampede, with the Canadian Rockies close by.' },
      { city: 'Edmonton', photo: 'assets/destinations/canada/edmonton.jpg', position: 'center bottom', fact: 'Alberta\'s capital, known as the "Festival City" and home to West Edmonton Mall, the largest shopping mall in North America.' },
      { city: 'Winnipeg', photo: 'assets/destinations/canada/winnipeg.jpg', fact: 'The capital of Manitoba, built where the Red and Assiniboine rivers meet at The Forks, a gathering place for thousands of years and now home to the Canadian Museum for Human Rights.' },
      { city: 'Halifax', photo: 'assets/destinations/canada/halifax.jpg', fact: 'Nova Scotia\'s capital and the largest city in Atlantic Canada, a harbour city overlooked by the star-shaped Citadel fortress and home to Dalhousie University.' },
      { city: 'Saskatoon', photo: 'assets/destinations/canada/saskatoon.jpg', fact: 'Known as the "City of Bridges" for the spans across the South Saskatchewan River, and home to the University of Saskatchewan.' },
    ],
  },
  {
    slug: 'ireland',
    name: 'Ireland',
    code: 'DUB',
    welcome: 'The Emerald Isle',
    tagline: 'EU-recognised degrees in a welcoming, English-speaking country.',
    facts: { intakes: 'Mainly September, some courses in January', language: 'IELTS, PTE, TOEFL or Duolingo', visa: 'Study visa (long-stay D), then Stamp 2' },
    why: [
      ['EU-recognised degrees', 'Qualifications respected across Europe and internationally.'],
      ['Strength in technology and science', 'Courses that draw on Ireland\'s strengths in technology, pharmaceuticals and research.'],
      ['Rich history and culture', 'Centuries of heritage, music and storytelling to explore while you study.'],
      ['English-speaking campus life', 'A welcoming student culture with no language barrier.'],
    ],
    areas: ['Information Technology', 'Pharmaceutical Sciences', 'Business', 'Engineering', 'Data Science'],
    visa: 'Your course must be on Ireland\'s list of eligible programmes. You apply for a long-stay (D) study visa with your letter of acceptance, proof that your fees are paid, proof of funds and private medical insurance, then register for your Stamp 2 student permission after you arrive.',
    visaChanges: 'visa fees and financial-evidence thresholds',
    visaAuthority: 'Irish immigration authorities',
    partners: [
      { city: 'Dublin', photo: 'assets/destinations/ireland/dublin.jpg', fact: 'Ireland\'s capital and largest city, home to Trinity College Dublin (founded in 1592) and the European headquarters of many global technology companies.' },
      { city: 'Cork', photo: 'assets/destinations/ireland/cork.jpg', fact: 'The Republic\'s second-largest city, with a historic centre on an island in the River Lee and one of the world\'s largest natural harbours nearby.' },
      { city: 'Galway', photo: 'assets/destinations/ireland/galway.jpg', fact: 'The "City of the Tribes" on Ireland\'s Atlantic coast, home to the University of Galway and a European Capital of Culture for 2020.' },
      { city: 'Limerick', photo: 'assets/destinations/ireland/limerick.jpg', fact: 'Set on the River Shannon and home to the 13th-century King John\'s Castle, which has stood over the river for more than 800 years.' },
      { city: 'Waterford', photo: 'assets/destinations/ireland/waterford.jpg', fact: 'Ireland\'s oldest city, founded by Vikings in 914 and famous around the world for Waterford Crystal.' },
      { city: 'Belfast', photo: 'assets/destinations/ireland/belfast.jpg', fact: 'The capital of Northern Ireland (part of the UK), where the RMS Titanic was built, now home to the Titanic Belfast visitor experience.' },
      { city: 'Derry', photo: 'assets/destinations/ireland/derry.jpg', fact: 'Northern Ireland\'s second-largest city (part of the UK), with 17th-century walls that are the most complete city walls in Ireland.' },
    ],
  },
  {
    slug: 'new-zealand',
    name: 'New Zealand',
    code: 'AKL',
    welcome: 'Land of the Long White Cloud',
    tagline: 'High-quality, practical education in a safe, welcoming country.',
    facts: { intakes: 'February and July', language: 'IELTS, PTE or another approved English test', visa: 'Fee Paying Student Visa' },
    why: [
      ['Quality-assured education', 'A national quality framework and a government code of practice set the standard for how providers look after international students.'],
      ['Practical, hands-on learning', 'Courses that build practical skills, research ability and independent thinking.'],
      ['Safe, welcoming communities', 'Regularly ranked among the most peaceful countries in the world.'],
      ['English-taught programs', 'No language barrier for Kenyan students entering the classroom.'],
    ],
    areas: ['Agriculture & Horticulture', 'Tourism & Hospitality', 'Engineering', 'Health Sciences', 'Information Technology'],
    visa: 'You apply for a Fee Paying Student Visa with an offer of place from an approved education provider, proof that you can pay your tuition fees and living costs, and insurance your provider accepts. You may also be asked for health checks and, for longer stays, police certificates.',
    visaChanges: 'visa fees and financial-evidence thresholds',
    visaAuthority: 'Immigration New Zealand',
    partners: [
      { city: 'Auckland', photo: 'assets/destinations/new-zealand/auckland.jpg', fact: 'New Zealand\'s largest city, known as the "City of Sails" and built on a narrow isthmus between two harbours.' },
      { city: 'Wellington', photo: 'assets/destinations/new-zealand/wellington.jpg', fact: 'New Zealand\'s capital and the world\'s southernmost national capital, known for its compact harbour setting and historic cable car.' },
      { city: 'Christchurch', photo: 'assets/destinations/new-zealand/christchurch.jpg', fact: 'The largest city in the South Island, known as the "Garden City" and home to the University of Canterbury.' },
      { city: 'Hamilton', photo: 'assets/destinations/new-zealand/hamilton.jpg', fact: 'Set on the Waikato River (New Zealand\'s longest) in a farming region, and home to the University of Waikato.' },
      { city: 'Tauranga', photo: 'assets/destinations/new-zealand/tauranga.jpg', fact: 'A coastal Bay of Plenty city beneath Mauao (Mount Maunganui), home to the country\'s largest port by cargo volume.' },
      { city: 'Dunedin', photo: 'assets/destinations/new-zealand/dunedin.jpg', fact: 'A student city with Scottish roots, home to the University of Otago, New Zealand\'s oldest university, founded in 1869.' },
    ],
  },
];

function footerDestLinks() {
  return countries.map(c => `          <a href="${c.slug}.html">${c.name}</a>`).join('\n');
}

// "3 partner institutions in Halifax: A, B and C." / "22 ... in Adelaide, including A, B and C."
function partnerSummary(city, list) {
  const names = list.slice(0, 3).map(i => esc(i.name));
  const joined = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
  const n = list.length;
  if (n === 1) return `1 partner institution in ${city}: ${joined}.`;
  if (n <= 3) return `${n} partner institutions in ${city}: ${joined}.`;
  return `${n} partner institutions in ${city}, including ${joined}.`;
}

// js/partners-<slug>.js, the full lists (with courses) the dialog reads, only for
// the cities that have a slide on the page. null when a country has no partner data.
function partnersData(c) {
  const cities = partnerData[c.name] ?? {};
  const shown = {};
  for (const p of c.partners) if (cities[p.city]?.length) shown[p.city] = cities[p.city];
  if (!Object.keys(shown).length) return null;
  return `// GENERATED by tools/generate-countries.mjs from tools/data/partner-institutions.json,
// edit the data file and re-run the script; changes made here will be overwritten.
window.PARTNERS = window.PARTNERS || {};
window.PARTNERS[${JSON.stringify(c.slug)}] = ${JSON.stringify(shown)};
`;
}

const searchIcon = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>`;
const arrowIcon = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 12h15M13.5 6l6 6-6 6"/></svg>`;

function page(c) {
  const partnerCities = partnerData[c.name] ?? {};
  const hasPartnerData = partnersData(c) !== null;

  // The "View partners & courses" dialog: markup only, main.js fills it from
  // js/partners-<slug>.js when a city's button is pressed.
  const partnersModal = hasPartnerData ? `
<div class="partners-overlay" id="partners-overlay" hidden>
  <div class="partners-modal" role="dialog" aria-modal="true" aria-labelledby="partners-title" id="partners-modal" tabindex="-1">
    <button type="button" class="partners-close" id="partners-close" aria-label="Close">&times;</button>
    <div class="partners-head">
      <span class="eyebrow">PARTNER INSTITUTIONS &middot; ${c.name.toUpperCase()}</span>
      <h2 class="partners-title" id="partners-title"></h2>
      <div class="partners-search">
        ${searchIcon}
        <label class="sr-only" for="partners-search-input">Search institutions or courses</label>
        <input type="search" id="partners-search-input" placeholder="Search by institution or course" autocomplete="off">
      </div>
      <p class="partners-count" id="partners-count" role="status" aria-live="polite"></p>
    </div>
    <div class="partners-body" id="partners-body"></div>
  </div>
</div>
` : '';
  const partnersScript = hasPartnerData ? `<script src="js/partners-${c.slug}.js"></script>\n` : '';
  const whyItems = c.why.map((w, i) => `          <li class="dest-why-item">
            <span class="dest-why-num" aria-hidden="true">0${i + 1}</span>
            <div>
              <h3>${w[0]}</h3>
              <p>${w[1]}</p>
            </div>
          </li>`).join('\n');

  const areaChips = c.areas.map(a => `            <li class="dest-area">${a}</li>`).join('\n');

  const helpSteps = HELP_STEPS.map((step, i) => `          <li><span class="dest-help-num" aria-hidden="true">0${i + 1}</span>${step}</li>`).join('\n');

  // Four city photos for the page's editorial spots: three in the "Why" collage,
  // one beside "How we help". A country may name them in `gallery`; otherwise
  // they're the second to fifth slideshow cities (the first is already on screen).
  // They use the smaller copies in <country>/editorial/ (see make-editorial-photos.mjs).
  const galleryPicks = (() => {
    const named = (c.gallery ?? []).map(n => c.partners.find(p => p.city === n)).filter(Boolean);
    const rest = c.partners.slice(1).concat(c.partners.slice(0, 1)).filter(p => !named.includes(p));
    return named.concat(rest).slice(0, 4);
  })();
  const galleryImg = (p, cls) => p
    ? `<img class="${cls}" src="${p.photo.replace(/\/([^/]+)$/, '/editorial/$1')}" alt="${p.city}" loading="lazy" decoding="async"${p.position ? ` style="object-position:${p.position};"` : ''}>`
    : '';

  const slideCount = c.partners.length > 0 ? c.partners.length : PLACEHOLDER_SLOTS;

  // A city may set `position` (a CSS background-position, e.g. 'center bottom')
  // when its photo is close to square and the default centred crop cuts off the
  // subject on the full-screen slide.
  // Each slide has a 3:4 portrait crop (made by make-editorial-photos.mjs) that
  // phones and portrait tablets load instead: they only ever see the middle of
  // the wide photo, so the crop looks the same at well under half the weight.
  const portraitOf = photo => photo.replace(/\/([^/]+)$/, '/portrait/$1');
  const citySlideStyle = p => (p.position ? ` style="background-position:${p.position};"` : '');
  // The first slide paints before main.js runs, so its photo is picked here by
  // a media query rather than by the script.
  const firstSlideCss = c.partners.length > 0
    ? `<style>.city-img.is-first{background-image:url('${c.partners[0].photo}')}@media (max-aspect-ratio:3/4){.city-img.is-first{background-image:url('${portraitOf(c.partners[0].photo)}')}}</style>\n`
    : '';

  const cityImages = (c.partners.length > 0
    ? c.partners.map((p, i) => `      <div class="city-img${i === 0 ? ' is-first' : ''}" data-src="${p.photo}" data-src-portrait="${portraitOf(p.photo)}"${citySlideStyle(p)}></div>`)
    : Array.from({ length: PLACEHOLDER_SLOTS }, () => `      <div class="city-img is-placeholder"></div>`)
  ).join('\n');

  const cityPanels = (c.partners.length > 0
    ? c.partners.map((p, i) => {
      const list = partnerCities[p.city] ?? [];
      const info = list.length
        ? `          <div class="city-panel-info has-partners">
            <div class="city-panel-info-label">PARTNER INSTITUTIONS</div>
            <p>${partnerSummary(p.city, list)}</p>
            <button type="button" class="partners-open" data-partners-city="${esc(p.city)}">View partners &amp; courses ${arrowIcon}</button>
          </div>`
        : `          <div class="city-panel-info">
            <div class="city-panel-info-label">PARTNER INSTITUTIONS</div>
            <p>Our counsellors can advise on study options in ${p.city}.</p>
            <a class="partners-open partners-ask" href="mailto:admissions@studiesandawardsltd.com?subject=Free%20Consultation%20Request%20-%20${encodeURIComponent(p.city.replace(/&(\w+);/g, (m, e) => ({ uuml: 'ü' }[e] || m)) + ', ' + c.name)}">Ask a counsellor ${arrowIcon}</a>
          </div>`;
      return `      <div class="city-panel" aria-hidden="true">
        <div class="city-panel-inner">
          <div class="city-panel-text">
            <div class="city-panel-index">${String(i + 1).padStart(2, '0')} / ${String(slideCount).padStart(2, '0')}</div>
            <p class="city-panel-name">${p.city}</p>
            <p class="city-panel-fact">${p.fact}</p>
          </div>
${info}
        </div>
      </div>`;
    })
    : Array.from({ length: PLACEHOLDER_SLOTS }, (_, i) => `      <div class="city-panel" aria-hidden="true">
        <div class="city-panel-inner">
          <div class="city-panel-text">
            <div class="city-panel-index">${String(i + 1).padStart(2, '0')} / ${String(slideCount).padStart(2, '0')}</div>
            <p class="city-panel-name">[City]</p>
            <p class="city-panel-fact">[A short, real fun fact about this city will go here.]</p>
          </div>
          <div class="city-panel-info">
            <div class="city-panel-info-label">PARTNER INSTITUTIONS</div>
            <p>[Add a city photo, then list partner institutions here.]</p>
          </div>
        </div>
      </div>`)
  ).join('\n');

  // One progress bar per city along the foot of the slide; the city's name is its
  // accessible name and its hover text, since the bars are too thin to label.
  const cityDots = Array.from({ length: slideCount }, (_, i) => {
    const p = c.partners[i];
    return `        <button type="button" class="city-dot" aria-label="Slide ${i + 1} of ${slideCount}${p ? ': ' + p.city : ''}"${p ? ` title="${esc(p.city)}"` : ''}><span class="city-dot-fill"></span></button>`;
  }).join('\n');

  const cityScroller = `  <section class="city-scroller" id="city-scroller" data-interval="10000" aria-label="${c.name} destination showcase" aria-roledescription="carousel">
${cityImages}
    <div class="city-scroller-vignette"></div>
    <div class="city-scroller-top-label">Welcome to ${c.name} <strong>&middot; ${c.welcome}</strong></div>
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
  const otherPills = otherCountries.map(o => `        <a href="${o.slug}.html" class="dest-pill"><img src="assets/flags/${o.slug}.svg" alt="" width="30" height="20"><span class="dest-pill-code">${o.code}</span><span class="dest-pill-name">${o.name}</span></a>`).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Study in ${c.name} | Studies and Awards Limited</title>
<meta name="description" content="${c.tagline.replace(/"/g, '&quot;')}">
${seoBlock({ title: `Study in ${esc(c.name)} | ${SITE_NAME}`, description: c.tagline.replace(/"/g, '&quot;'), path: `/${c.slug}.html`, image: `assets/share/${c.slug}.jpg`, imageAlt: `Study in ${esc(c.name)}${c.partners[0] ? ', ' + c.partners[0].city : ''}` })}
<link rel="icon" type="image/png" href="assets/favicon.png">
<link rel="preload" href="assets/fonts/montserrat.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/bebas-neue.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/oswald.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="css/styles.css">
${firstSlideCss}</head>
<body>

<a href="#main" class="skip-link">Skip to content</a>

<header class="site-header header-overlay">
  <div class="container">
    <a href="index.html" class="brand" aria-label="Studies and Awards home">
      <span class="brand-mark" aria-hidden="true">
        <img src="assets/logo-mark.png" alt="" width="120" height="80">
      </span>
      <span class="brand-name">Studies &amp; Awards Limited</span>
    </a>
    <nav class="primary-nav" id="primary-nav" aria-label="Primary">
      <a href="destinations.html" class="nav-link" aria-current="page">Destinations</a>
      <a href="services.html" class="nav-link">Services</a>
      <a href="about.html" class="nav-link">About Us</a>
      <a href="team.html" class="nav-link">Team</a>
      <a href="location.html" class="nav-link">Find Us</a>
      <div class="nav-portal">
        <button type="button" class="nav-link muted nav-portal-btn" aria-expanded="false" aria-controls="portal-menu">Portal login<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
        <span class="nav-portal-label">Portal login</span>
        <div class="nav-portal-menu" id="portal-menu">
          <a href="https://student.studiesandawardsltd.com/login" class="nav-portal-item"><span class="nav-portal-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg></span><span class="nav-portal-text"><strong>Student portal</strong><span>Sign in to your student account</span></span></a>
          <a href="https://student.studiesandawardsltd.com/staff-login" class="nav-portal-item"><span class="nav-portal-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span><span class="nav-portal-text"><strong>Staff portal</strong><span>For Studies &amp; Awards staff</span></span></a>
          <a href="admin/index.html" class="nav-portal-item"><span class="nav-portal-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.4 2.6a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg></span><span class="nav-portal-text"><strong>Admin portal</strong><span>Manage the testimonials on the home page</span></span></a>
        </div>
      </div>
      <a href="mailto:admissions@studiesandawardsltd.com?subject=Free%20Consultation%20Request" class="btn btn-primary nav-cta-mobile">Book Free Consultation</a>
    </nav>
    <div class="header-cta">
      ${themeToggle('      ')}
      <a href="mailto:admissions@studiesandawardsltd.com?subject=Free%20Consultation%20Request" class="btn btn-primary">Book Free Consultation</a>
      <button class="nav-toggle" aria-label="Open menu" aria-controls="primary-nav" aria-expanded="false">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
    </div>
  </div>
</header>

<main id="main">

${cityScroller}

  <section class="dest-intro" aria-labelledby="hero-heading">
    <div class="container">
      <span class="hero-kicker">STUDY DESTINATION &middot; ${c.code}</span>
      <h1 id="hero-heading">Study in ${c.name}</h1>
      <p>${c.tagline}</p>
      <div class="dest-intro-actions">
        <a href="mailto:admissions@studiesandawardsltd.com?subject=Free%20Consultation%20Request%20-%20${encodeURIComponent(c.name)}" class="btn btn-primary">Book a free consultation</a>
        <a href="destinations.html" class="btn btn-outline">View other destinations</a>
      </div>${c.slug === 'australia' ? `
      <button type="button" class="ai-check" data-ai-checker>
        <svg class="ai-check-spark" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9zM19 15l.9 2.1 2.1.9-2.1.9L19 21l-.9-2.1-2.1-.9 2.1-.9z"/></svg>
        <span class="ai-check-text">Check your eligibility for Australia</span>
        <span class="ai-check-tag">Coming soon</span>
      </button>` : ''}
    </div>
  </section>

  <section class="dest-why" aria-labelledby="why-heading">
    <div class="container dest-split">
      <div class="dest-collage">
        ${galleryImg(galleryPicks[0], 'dest-collage-a')}
        ${galleryImg(galleryPicks[1], 'dest-collage-b')}
        ${galleryImg(galleryPicks[2], 'dest-collage-c')}
      </div>
      <div class="dest-why-body">
        <span class="dest-eyebrow">WHY ${c.name.toUpperCase()}</span>
        <h2 id="why-heading">A destination built for ambitious students</h2>
        <ol class="dest-why-list">
${whyItems}
        </ol>
      </div>
    </div>
  </section>

  <section class="dest-help" aria-labelledby="help-heading">
    <div class="container dest-split dest-split-rev">
      <div class="dest-help-body">
        <span class="dest-eyebrow">HOW WE HELP YOU GET THERE</span>
        <h2 id="help-heading">From your first meeting with us to your first lecture</h2>
        <ol class="dest-help-list">
${helpSteps}
        </ol>
        <div class="dest-areas">
          <h3 class="dest-eyebrow" id="areas-heading">POPULAR STUDY AREAS</h3>
          <ul class="dest-areas-list" aria-labelledby="areas-heading">
${areaChips}
          </ul>
        </div>
      </div>
      <div class="dest-visa-wrap">
        ${galleryImg(galleryPicks[3], 'dest-visa-photo')}
        <div class="dest-visa">
          <h3 class="dest-visa-title" id="visa-heading">Visa &amp; requirements</h3>
          <p>${c.visa}</p>
          <p class="dest-visa-small">Current ${c.visaChanges} are set by ${c.visaAuthority} and change from time to time.</p>
          <a href="mailto:admissions@studiesandawardsltd.com?subject=Free%20Consultation%20Request%20-%20${encodeURIComponent(c.name)}">Confirm the current rules with a counsellor</a>
        </div>
      </div>
    </div>
  </section>

  <section class="container section-tight next-dest-section" id="next-destination" data-current="${c.slug}" aria-label="Next destination"></section>

  <section class="container dest-others" aria-labelledby="others-heading">
    <h2 id="others-heading">Other destinations</h2>
    <div class="dest-pills">
${otherPills}
    </div>
  </section>

  <section class="cta-band" id="contact" aria-labelledby="cta-heading">
    <div class="container">
      <div class="cta-panel">
        <div>
          <h2 id="cta-heading">Ready to study in ${c.name}?</h2>
          <p>Book a free consultation, or explore our other study destinations.</p>
        </div>
        <div class="cta-actions">
          <a href="tel:+254721796500" class="cta-phone">+254 721 796500</a>
          <a href="mailto:admissions@studiesandawardsltd.com?subject=Free%20Consultation%20Request%20-%20${encodeURIComponent(c.name)}" class="btn btn-primary">Book a free consultation</a>
        </div>
      </div>
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
          <span class="brand-name">Studies &amp; Awards Limited</span>
        </div>
        <p class="footer-blurb">Personalised guidance from your first meeting with us until you arrive and start your studies abroad.</p>
      </div>
      <nav aria-label="Quick links">
        <div class="footer-heading">QUICK LINKS</div>
        <div class="footer-links">
          <a href="index.html">Home</a>
          <a href="about.html">About Us</a>
          <a href="services.html">Services</a>
          <a href="team.html">Our Team</a>
          <a href="location.html">Find Us</a>
          <a href="https://www.magistersacco.org/">Financial Support</a>
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
          <a class="footer-contact-row" href="https://www.google.com/maps/search/?api=1&amp;query=Daima%20Towers%2C%20Eldoret%2C%20Kenya" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#B9C3E0" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.3"/></svg>
            <span>Daima Towers, Mezzanine 1, Eldoret, Kenya<span class="footer-contact-note footer-contact-link">Get directions<span class="sr-only"> on Google Maps (opens in a new tab)</span></span></span>
          </a>
          <div class="footer-contact-row">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#B9C3E0" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>
            <span>Mon&ndash;Fri, 8am&ndash;5pm<span class="open-status" data-open-status hidden></span><span class="footer-contact-note">Closed weekends &amp; public holidays</span></span>
          </div>
          <a class="footer-contact-row" href="tel:+254721796500">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#B9C3E0" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3c0 1-.9 1.8-1.9 1.6C10.9 18.3 5.7 13.1 4.9 6.9 4.7 5.9 5 3.5 6 3.5Z"/></svg>
            <span>+254 721 796500</span>
          </a>
          <a class="footer-contact-row" href="mailto:admissions@studiesandawardsltd.com">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#B9C3E0" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><path d="M4 6.5 12 12.5 20 6.5"/></svg>
            <span>admissions@<wbr>studiesandawardsltd.com</span>
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
      <div class="nav-portal nav-portal-foot footer-bottom-legal">
        <button type="button" class="nav-portal-btn" aria-expanded="false" aria-controls="portal-menu-foot">Portal login<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
        <div class="nav-portal-menu" id="portal-menu-foot">
          <a href="https://student.studiesandawardsltd.com/login" class="nav-portal-item"><span class="nav-portal-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg></span><span class="nav-portal-text"><strong>Student portal</strong><span>Sign in to your student account</span></span></a>
          <a href="https://student.studiesandawardsltd.com/staff-login" class="nav-portal-item"><span class="nav-portal-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span><span class="nav-portal-text"><strong>Staff portal</strong><span>For Studies &amp; Awards staff</span></span></a>
          <a href="admin/index.html" class="nav-portal-item"><span class="nav-portal-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.4 2.6a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg></span><span class="nav-portal-text"><strong>Admin portal</strong><span>Manage the testimonials on the home page</span></span></a>
        </div>
      </div>
      <span class="footer-bottom-copyright">
        <span>&copy; <span id="current-year">2026</span> Studies and Awards Limited. All rights reserved.</span>
        <span class="footer-bottom-note">Certified Data Controller</span>
      </span>
      <div class="footer-bottom-social">
        <a href="https://www.facebook.com/studiesandawards/" class="social-link social-facebook" aria-label="Facebook"><svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951"/></svg></a>
        <a href="https://www.instagram.com/studiesandawardsltd/" class="social-link social-instagram" aria-label="Instagram"><svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334"/></svg></a>
        <a href="https://ke.linkedin.com/company/studies-and-awards-limited" class="social-link social-linkedin" aria-label="LinkedIn"><svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z"/></svg></a>
        <a href="https://www.youtube.com/@studiesandawardslimited4356" class="social-link social-youtube" aria-label="YouTube"><svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.01 2.01 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.01 2.01 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31 31 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.01 2.01 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A100 100 0 0 1 7.858 2zM6.4 5.209v4.818l4.157-2.408z"/></svg></a>
      </div>
    </div>
  </div>
</footer>
${partnersModal}
<script src="js/team-data.js"></script>
<script src="js/destinations-data.js"></script>
${partnersScript}<script src="js/theme.js"></script>
<script src="js/main.js"></script>
</body>
</html>
`;
}

// js/destinations-data.js, the registry the "next destination" boarding-pass
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

  return `// Destination registry, GENERATED by tools/generate-countries.mjs from its
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

// ---- the Destinations page's key facts ----------------------------------------
// destinations.html is written by hand, but each card's facts (intakes, language
// test, student visa and partner institutions) and the "Compare at a
// glance" table come from the `facts` of each country above and from the
// partner data, written between marked comments: <!-- facts:<slug>:start -->
// ... <!-- facts:<slug>:end --> inside each card, and <!-- compare:start -->
// ... <!-- compare:end --> after the cards. Edit the facts here, not there.

// the partner institutions a country's page lists (only cities with a slide,
// as in partnersData), or null
function partnerCount(c) {
  const cities = partnerData[c.name] ?? {};
  const names = new Set();
  let shown = 0;
  for (const p of c.partners) {
    if (!cities[p.city]?.length) continue;
    shown++;
    for (const inst of cities[p.city]) names.add(inst.name);
  }
  return names.size ? { institutions: names.size, cities: shown } : null;
}
const partnerLine = s => `${s.institutions} partner institution${s.institutions === 1 ? '' : 's'} across ${s.cities} ${s.cities === 1 ? 'city' : 'cities'}`;

function cardFacts(c) {
  const p = partnerCount(c);
  const fact = (label, value) => `              <span class="dest-fact"><span class="dest-fact-label">${label}</span><span class="dest-fact-value">${esc(value)}</span></span>`;
  return [
    `            <!-- facts:${c.slug}:start, written by tools/generate-countries.mjs; edit the script, not this block -->`,
    '            <span class="dest-card-facts">',
    fact('Intakes', c.facts.intakes),
    fact('Language test', c.facts.language),
    fact('Visa', c.facts.visa),
    '            </span>',
    ...(p ? [`            <span class="dest-card-partners">${partnerLine(p)}</span>`] : []),
    `            <!-- facts:${c.slug}:end -->`,
  ].join('\n');
}

function compareTable() {
  const rows = countries.map(c => {
    const p = partnerCount(c);
    return [
      '            <tr>',
      `              <th scope="row"><a href="${c.slug}.html"><img src="assets/flags/${c.slug}.svg" alt="" width="30" height="20">${esc(c.name)}</a></th>`,
      `              <td data-label="Intakes">${esc(c.facts.intakes)}</td>`,
      `              <td data-label="Language test">${esc(c.facts.language)}</td>`,
      `              <td data-label="Visa">${esc(c.facts.visa)}</td>`,
      `              <td data-label="Partner institutions">${p ? `${p.institutions} across ${p.cities} ${p.cities === 1 ? 'city' : 'cities'}` : 'Ask us'}</td>`,
      '            </tr>',
    ].join('\n');
  }).join('\n');
  return `  <!-- compare:start, written by tools/generate-countries.mjs; edit the script, not this block -->
  <section class="dest-compare" aria-labelledby="compare-heading">
    <div class="container">
      <div class="dest-compare-head">
        <h2 id="compare-heading">Compare at a glance</h2>
        <p>The basics for each country. Rules and requirements change, so we confirm the details for your course at your free consultation.</p>
      </div>
      <div class="dest-compare-scroll">
        <table class="dest-compare-table">
          <thead>
            <tr>
              <th scope="col">Destination</th>
              <th scope="col">Intakes</th>
              <th scope="col">Language test</th>
              <th scope="col">Visa</th>
              <th scope="col">Partner institutions</th>
            </tr>
          </thead>
          <tbody>
${rows}
          </tbody>
        </table>
      </div>
    </div>
  </section>
  <!-- compare:end -->`;
}

function withDestinationFacts(html) {
  let out = html;
  for (const c of countries) {
    const block = new RegExp(`[ \\t]*<!-- facts:${c.slug}:start[\\s\\S]*?<!-- facts:${c.slug}:end -->`);
    if (!block.test(out)) throw new Error(`destinations.html: no <!-- facts:${c.slug}:start --> ... <!-- facts:${c.slug}:end --> in its card`);
    out = out.replace(block, () => cardFacts(c));
  }
  const compare = /[ \t]*<!-- compare:start[\s\S]*?<!-- compare:end -->/;
  if (!compare.test(out)) throw new Error('destinations.html: no <!-- compare:start --> ... <!-- compare:end -->');
  return out.replace(compare, () => compareTable());
}

// Everything this script owns, as [path relative to site/, content].
const outputs = [
  ...countries.map(c => [`${c.slug}.html`, page(c)]),
  ...countries.flatMap(c => {
    const data = partnersData(c);
    return data ? [[`js/partners-${c.slug}.js`, data]] : [];
  }),
  ['js/destinations-data.js', destinationsData()],
  ...HAND_PAGES.map(f => {
    const html = readFileSync(join(siteDir, f), 'utf8');
    return [f, withSeoBlock(f === 'destinations.html' ? withDestinationFacts(html) : html, f)];
  }),
];

// Heads-up: partner data for a city that has no slide (no photo yet) isn't shown anywhere.
const unshown = countries.flatMap(c => Object.keys(partnerData[c.name] ?? {})
  .filter(city => !c.partners.some(p => p.city === city))
  .map(city => `${city} (${c.name})`));
// Heads-up: partner data whose country isn't one of ours.
const unknownCountries = Object.keys(partnerData).filter(name => !countries.some(c => c.name === name));

// CLI:
//   node tools/generate-countries.mjs               write the generated files into site/
//   node tools/generate-countries.mjs --out <dir>   write them somewhere else instead
//   node tools/generate-countries.mjs --check       change nothing; exit 1 if any generated
//                                                   file in site/ differs from what this
//                                                   script would produce (i.e. someone
//                                                   hand-edited it, or this script is behind)
const isMain = fileURLToPath(import.meta.url).toLowerCase() === resolve(process.argv[1] || '').toLowerCase();
const args = isMain ? process.argv.slice(2) : [];
const outFlag = args.indexOf('--out');
if (outFlag > -1 && (!args[outFlag + 1] || args[outFlag + 1].startsWith('--'))) {
  console.error('usage: node tools/generate-countries.mjs [--out <dir>] [--check]');
  process.exit(2);
}
const outDir = outFlag > -1 ? resolve(args[outFlag + 1]) : siteDir;

if (!isMain) {
  // imported by another tool: expose the data, do nothing else
} else if (args.includes('--check')) {
  const drifted = outputs.filter(([rel, content]) => {
    const file = join(siteDir, rel);
    return !existsSync(file) || readFileSync(file, 'utf8') !== content;
  });
  // A stray keystroke in a hand-edited script (e.g. team-data.js) makes the whole file fail to load
  // and silently switches its feature off, so --check also confirms every site script still parses.
  const broken = readdirSync(join(siteDir, 'js')).filter(f => f.endsWith('.js')).flatMap(f => {
    try { new vm.Script(readFileSync(join(siteDir, 'js', f), 'utf8'), { filename: f }); return []; }
    catch (e) { return [`js/${f}: ${e.message}`]; }
  });
  // (Testimonials: the real ones live in the Supabase database and are managed from site/admin/;
  // js/testimonials-data.js only holds samples, which show on your own copy and never on a real
  // website address, so they need no check here.)
  // The destination pages' collage photos are small copies made by make-editorial-photos.mjs.
  const missingPhotos = [...new Set(outputs.flatMap(([, content]) => content.match(/assets\/destinations\/[\w-]+\/(?:editorial|thumbs|portrait)\/[\w-]+\.jpg/g) || []))]
    .filter(rel => !existsSync(join(siteDir, rel)));
  // A country renamed or dropped leaves its partner script behind, and the drift check above
  // cannot see it: `outputs` only ever describes today's countries.
  const expected = new Set(outputs.map(([rel]) => rel));
  const orphans = readdirSync(join(siteDir, 'js'))
    .filter(f => /^partners-.*\.js$/.test(f))
    .map(f => `js/${f}`)
    .filter(rel => !expected.has(rel));
  if (drifted.length || broken.length || missingPhotos.length || orphans.length) {
    if (drifted.length) console.error('Out of date (hand-edited, or the generator is behind):\n  ' + drifted.map(([rel]) => rel).join('\n  '));
    if (orphans.length) console.error('Generated files this script no longer produces (country renamed or removed?):\n  ' + orphans.join('\n  '));
    if (missingPhotos.length) console.error('Missing small city photos (run node tools/make-editorial-photos.mjs):\n  ' + missingPhotos.join('\n  '));
    if (broken.length) console.error('Script syntax errors (the page feature they power will not work):\n  ' + broken.join('\n  '));
    process.exit(1);
  }
  console.log(`All ${outputs.length} generated files match the generator, and every site script parses.`);
} else {
  for (const [rel, content] of outputs) {
    const out = join(outDir, rel);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, content, 'utf8');
    console.log('wrote', out);
  }
  if (unshown.length) console.log(`\nnote: partner data exists for cities with no slide yet, so it isn't shown: ${unshown.join(', ')}.\n      Add the city (with a photo) to that country's \`partners\` list to show it.`);
  if (unknownCountries.length) console.log(`\nnote: partner data for countries with no page: ${unknownCountries.join(', ')}`);
}

export { countries, footerDestLinks };
