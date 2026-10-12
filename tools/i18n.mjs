#!/usr/bin/env node
// Translation helper for the language switch (site/js/i18n.js).
//
//   node tools/i18n.mjs template <code>        write tools/i18n/<code>-to-translate.csv:
//                                              every English line the site has a
//                                              translation slot for, the Kiswahili
//                                              beside it, and an empty "translation"
//                                              column to fill in (--force to overwrite
//                                              a sheet that already exists)
//   node tools/i18n.mjs import <code> <file>   read a filled-in CSV back and write
//                                              site/js/i18n-<code>.js (empty rows are
//                                              skipped, so that text stays English)
//
// The English list comes from site/js/i18n-sw.js (the complete one). Columns:
// english, type (text / html / label / title), kiswahili, translation. In an "html" row keep
// the tags and links exactly as in the English and only change the words.
// A language shows in the switcher once it is marked reviewed in site/js/i18n.js.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NAMES = { sw: 'Kiswahili', kal: 'Kalenjin' };
const TYPE_OF = { 'H:': 'html', 'A:': 'label', 'T:': 'title' };
const PREFIX_OF = { html: 'H:', label: 'A:', title: 'T:', text: '' };

function loadDict(code) {
  const file = path.join(root, 'site/js', `i18n-${code}.js`);
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox);
  return sandbox.window.SA_I18N[code] || {};
}

const q = s => `"${String(s).replace(/"/g, '""')}"`;

function parseCsv(text) {
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = ''; rows.push(row); row = [];
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const [cmd, code, file] = process.argv.slice(2);
if (!NAMES[code] || !['template', 'import'].includes(cmd)) {
  console.error('usage: node tools/i18n.mjs template <sw|kal>\n       node tools/i18n.mjs import <sw|kal> <file.csv>');
  process.exit(1);
}

if (cmd === 'template') {
  const out = path.join(root, 'tools/i18n', `${code}-to-translate.csv`);
  if (fs.existsSync(out) && !process.argv.includes('--force')) {
    console.error(`${path.relative(root, out)} already exists (it may hold someone's work). Add --force to overwrite it.`);
    process.exit(1);
  }
  const sw = loadDict('sw');
  const english = Object.keys(sw);
  const existing = (() => { try { return loadDict(code); } catch { return {}; } })();
  // Kiswahili sits beside the English as a bridge: most Kalenjin speakers in the
  // Eldoret area read Swahili well, and a translator can check meaning against both
  const lines = ['english,type,kiswahili,translation'];
  for (const key of english) {
    const prefix = key.slice(0, 2);
    const type = TYPE_OF[prefix] || 'text';
    const text = TYPE_OF[prefix] ? key.slice(2) : key;
    lines.push([q(text), type, q(code === 'sw' ? '' : sw[key]), q(existing[key] ?? '')].join(','));
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, lines.join('\n') + '\n');
  console.log(`wrote ${path.relative(root, out)} (${english.length} lines)`);
} else {
  if (!file) { console.error('give the CSV file to import'); process.exit(1); }
  const all = parseCsv(fs.readFileSync(file, 'utf8'));
  const head = all[0].map(h => h.trim().toLowerCase());
  const col = name => head.indexOf(name);
  if (col('english') < 0 || col('translation') < 0) { console.error('the CSV needs english, type and translation columns'); process.exit(1); }
  const entries = [];
  for (const r of all.slice(1)) {
    const english = r[col('english')], type = r[col('type')], translation = r[col('translation')];
    if (!english || !translation || !translation.trim()) continue;
    const prefix = PREFIX_OF[(type || 'text').trim()] ?? '';
    entries.push([prefix + english, translation.trim()]);
  }
  const body = [
    `// ${NAMES[code]} (${code}): the site's English text -> ${NAMES[code]}, written by tools/i18n.mjs`,
    ...(code === 'kal' ? ['// A DRAFT, NOT YET CHECKED BY A SPEAKER: see tools/i18n/kalenjin-notes.md.'] : []),
    '// from a spreadsheet. Edit lines here directly if you like: each line is',
    '// "English text": "translation". See the top of js/i18n.js for what the keys mean.',
    'window.SA_I18N = window.SA_I18N || {};',
    `window.SA_I18N.${code} = {`,
    ...entries.map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`),
    '};',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(root, 'site/js', `i18n-${code}.js`), body);
  console.log(`wrote site/js/i18n-${code}.js (${entries.length} translated lines)`);
}
