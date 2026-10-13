// Website content that can be edited from the admin page, without touching
// the files. Everything here works on the page's text, in one pass:
//
//   scan*  lists what can be edited on a page (for the admin page)
//   apply* swaps in the edited versions when a page is sent to a visitor
//
// An edit is stored against the ORIGINAL wording (text, link, picture path),
// so it keeps working however the page around it changes, and it can be
// reset to the original at any time. If the original wording is changed in
// the files, the old edit simply stops matching and the new original shows.

export const PAGES = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About us' },
  { path: '/services', label: 'Services' },
  { path: '/destinations', label: 'Destinations' },
  { path: '/australia', label: 'Australia' },
  { path: '/canada', label: 'Canada' },
  { path: '/germany', label: 'Germany' },
  { path: '/ireland', label: 'Ireland' },
  { path: '/new-zealand', label: 'New Zealand' },
  { path: '/united-kingdom', label: 'United Kingdom' },
  { path: '/team', label: 'Team page' },
  { path: '/blog', label: 'Blog' },
  { path: '/location', label: 'Location' },
  { path: '/404', label: 'Page not found' }
];

// pictures and text that live in script/style files rather than in the pages
export const TEAM_FILE = '/js/team-data.js';
export const STYLE_FILE = '/css/styles.css';
// the team fields that are shown to visitors as words (not ids, filters or paths)
const TEAM_FIELDS = new Set(['name', 'role', 'helpsWith', 'whatsapp', 'shortBio', 'fullBio', 'linkedin']);

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
  mdash: '—', ndash: '–', hellip: '…', middot: '·', times: '×', copy: '©', reg: '®', bull: '•', laquo: '«', raquo: '»',
  trade: '™', check: '✓', rarr: '→', larr: '←', euro: '€', pound: '£'
};

export function decode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      try { return String.fromCodePoint(code); } catch (x) { return m; }
    }
    return Object.prototype.hasOwnProperty.call(ENTITIES, e.toLowerCase()) ? ENTITIES[e.toLowerCase()] : m;
  });
}

export function norm(s) {
  return decode(s).replace(/\s+/g, ' ').trim();
}

export function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escAttr(s) {
  return esc(s).replace(/"/g, '&quot;');
}

const IMAGE_PATH = /(?<![\w-])(?:\.\.\/|\.\/|\/)?(assets\/[^"'()\s<>\\]+?\.(?:jpe?g|png|webp|gif|svg))(?![\w-])/gi;
const HAS_WORD = /[A-Za-z0-9À-ɏ]/;
const SAFE_LINK = /^(https?:\/\/|mailto:|tel:)/i;

// ---------- what can be edited ----------

// `html` is the page exactly as it is in the files
export function scanHtml(html) {
  const items = [];
  const seen = new Set();
  const add = (item) => {
    const k = item.kind + '\0' + item.original;
    if (seen.has(k)) return;
    seen.add(k);
    items.push(item);
  };

  // the tab title and the descriptions used when a link is shared
  const head = (/<head[\s\S]*?<\/head>/i.exec(html) || [''])[0];
  const title = /<title>([\s\S]*?)<\/title>/i.exec(head);
  if (title && norm(title[1])) add({ kind: 'text', original: norm(title[1]), section: 'Page title and sharing', label: 'Page title (browser tab)' });
  const metaRe = /<meta\b([^>]*)>/gi;
  let mm;
  while ((mm = metaRe.exec(head))) {
    const a = attrs(mm[1]);
    const name = a.name || a.property;
    if (a.content && /^(description|og:title|og:description|twitter:title|twitter:description)$/.test(name || '')) {
      add({ kind: 'meta', original: decode(a.content), section: 'Page title and sharing', label: name === 'description' ? 'Description for search engines' : 'Link preview (' + name.replace(/^(og|twitter):/, '') + ')' });
    }
  }

  const body = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!doctype[^>]*>/i, '')
    .replace(/<head[\s\S]*?<\/head>/i, '')
    .replace(/<(script|style|svg|noscript|template|textarea)\b[\s\S]*?<\/\1>/gi, '');

  let section = 'Page';
  let heading = null; // text collected while inside a heading
  let link = null; // { href, text } while inside a link
  const re = /<(\/?)([a-z][a-z0-9-]*)([^>]*)>|([^<]+)/gi;
  let m;
  while ((m = re.exec(body))) {
    if (m[4] !== undefined) {
      const text = norm(m[4]);
      if (text.length < 2 || !HAS_WORD.test(text)) continue;
      if (heading !== null) heading += ' ' + text;
      if (link) link.text += ' ' + text;
      add({ kind: 'text', original: text, section });
      continue;
    }
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();
    if (/^h[1-3]$/.test(tag)) {
      if (!closing) heading = '';
      else if (heading !== null) { section = heading.trim().slice(0, 80) || section; heading = null; }
    } else if (tag === 'a') {
      if (!closing) {
        const href = decode(attrs(m[3]).href || '');
        link = SAFE_LINK.test(href) ? { href, text: '' } : null;
      } else if (link) {
        add({ kind: 'link', original: link.href, section, label: link.text.trim().slice(0, 80) });
        link = null;
      }
    } else if (tag === 'img' && !closing) {
      const alt = decode(attrs(m[3]).alt || '').trim();
      if (alt.length > 1) add({ kind: 'alt', original: alt, section });
    }
  }
  return items;
}

function attrs(s) {
  const out = {};
  const re = /([a-zA-Z_:][-\w:.]*)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(s))) out[m[1].toLowerCase()] = m[2];
  return out;
}

// every picture a page, style or script file points at
export function scanImages(source) {
  const found = new Set();
  let m;
  const re = new RegExp(IMAGE_PATH.source, 'gi');
  while ((m = re.exec(source))) found.add(m[1]);
  return [...found];
}

// the words in the team file: { id, name } sections, fields as labels
export function scanTeam(js) {
  const items = [];
  walkTeam(js, (token) => {
    if (!token.field) return;
    items.push({
      kind: 'text', original: token.text, section: token.member, label: token.field,
      scope: 'team:' + token.id
    });
  });
  return items;
}

// Goes through the team file's quoted strings, with the field and the person
// each one belongs to, and lets `visit` replace the ones that are editable.
function walkTeam(js, visit, replace) {
  const re = /\/\/[^\n]*|\/\*[\s\S]*?\*\/|([A-Za-z_]\w*)\s*:\s*|(['"])((?:\\.|(?!\2)[^\\\n])*)\2|([[\]])/g;
  let lastKey = '';
  let arrayKey = '';
  let id = '';
  let member = '';
  let m;
  let out = '';
  let last = 0;
  while ((m = re.exec(js))) {
    if (m[1] === undefined && m[2] === undefined && m[4] === undefined) continue; // a comment
    if (m[1] !== undefined) { lastKey = m[1]; continue; }
    if (m[4] !== undefined) {
      if (m[4] === '[') { arrayKey = lastKey; } else { arrayKey = ''; }
      continue;
    }
    const raw = m[3];
    const text = unescapeJs(raw);
    const key = arrayKey || lastKey;
    if (key === 'id' && !arrayKey) { id = text; member = text; continue; }
    if (key === 'name' && !arrayKey) member = text;
    if (!TEAM_FIELDS.has(key)) continue;
    const norm1 = norm(text);
    if (norm1.length < 2) continue;
    const token = { field: key, text: norm1, id, member: member || id, start: m.index, end: m.index + m[0].length };
    if (replace) {
      const value = replace(token);
      if (value !== undefined) {
        out += js.slice(last, token.start) + JSON.stringify(value);
        last = token.end;
      }
    } else {
      visit(token);
    }
  }
  return replace ? out + js.slice(last) : null;
}

function unescapeJs(s) {
  return s.replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|[\s\S])/g, (m, e) => {
    if (e[0] === 'u' || e[0] === 'x') return String.fromCharCode(parseInt(e.slice(1), 16));
    return { n: '\n', t: '\t', r: '\r' }[e] || e;
  });
}

// ---------- putting the edits in ----------

// rows: { scope, kind, original, value }
export function buildRules(rows) {
  const rules = { any: rows.length > 0, text: new Map(), meta: new Map(), alt: new Map(), link: new Map(), image: new Map(), team: new Map(), version: '0' };
  for (const r of rows) {
    const key = r.scope + '\0' + r.original;
    if (r.scope.startsWith('team:')) rules.team.set(key, r.value);
    else if (r.kind === 'image') rules.image.set(r.original, r.value);
    else if (rules[r.kind]) rules[r.kind].set(key, r.value);
    if (r.updated_at && r.updated_at > rules.version) rules.version = r.updated_at;
  }
  rules.version = rules.version.replace(/\D/g, '').slice(0, 14) || '0';
  return rules;
}

function pick(map, page, original) {
  const v = map.get(page + '\0' + original);
  return v !== undefined ? v : map.get('*\0' + original);
}

export function applyHtml(html, page, rules) {
  // words
  if (rules.text.size) {
    html = html.replace(/>([^<>]+)</g, (m, t) => {
      const v = pick(rules.text, page, norm(t));
      if (v === undefined) return m;
      return '>' + /^\s*/.exec(t)[0] + esc(v) + /\s*$/.exec(t)[0] + '<';
    });
  }
  // descriptions, picture descriptions, links
  if (rules.meta.size || rules.alt.size || rules.link.size) {
    html = html.replace(/(\s)(alt|content|href)="([^"]*)"/g, (m, sp, name, val) => {
      const map = name === 'alt' ? rules.alt : name === 'content' ? rules.meta : rules.link;
      if (!map.size) return m;
      const v = pick(map, page, name === 'alt' ? decode(val).trim() : decode(val));
      return v === undefined ? m : sp + name + '="' + escAttr(v) + '"';
    });
  }
  // the page's own script and style files, when they have edits to carry
  if (rules.team.size || rules.image.size) {
    html = html
      .replace(/(["'])(?:\.\.\/|\.\/|\/)?js\/team-data\.js\1/g, (m, q) => q + '/api/site/team-data.js?v=' + rules.version + q)
      .replace(/(["'])(?:\.\.\/|\.\/|\/)?css\/styles\.css\1/g, (m, q) => q + '/api/site/styles.css?v=' + rules.version + q);
  }
  return applyImages(html, rules);
}

export function applyImages(source, rules) {
  if (!rules.image.size) return source;
  return source.replace(IMAGE_PATH, (m, path) => rules.image.get(path) || m);
}

export function applyTeam(js, rules) {
  if (!rules.team.size) return applyImages(js, rules);
  const edited = walkTeam(js, null, (token) => rules.team.get('team:' + token.id + '\0' + token.text));
  return applyImages(edited, rules);
}

export { SAFE_LINK };
