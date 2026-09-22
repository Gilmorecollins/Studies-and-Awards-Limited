import { existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

// Turns raw destination photos into the web-ready versions the site uses.
//
//   node tools/process-photos.mjs <source folder> <site folder>
//   node tools/process-photos.mjs "New zealand" new-zealand
//   node tools/process-photos.mjs Canada canada --changed      only new or replaced photos
//   node tools/process-photos.mjs Canada canada --out <dir>    write somewhere else (to preview)
//
// --changed skips every photo whose web-ready copy already exists and is newer
// than the source, so adding a few cities never re-encodes the ones already live.
//
// Reads   source-assets/destination-photos/<source folder>/*.jpg
// Writes  site/assets/destinations/<site folder>/<city>.jpg   (city = the file name, lower-cased)
//
// Each photo is resized to 1920px wide (the height follows, so nothing is
// cropped) and saved as a JPEG. Quality starts at 80 and steps down until the
// file is about 500 KB or less, but never below 60 — very detailed photos
// (aerials, for instance) can still come out a little heavier than that.
//
// Afterwards, add the cities to that country's `partners` list in
// generate-countries.mjs and run it (see the README).

const WIDTH = 1920;
const START_QUALITY = 80;
const MIN_QUALITY = 60;
const QUALITY_STEP = 4;
const MAX_KB = 520;

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const sourceRoot = join(repoRoot, 'source-assets', 'destination-photos');

const args = process.argv.slice(2);
const changedOnly = args.includes('--changed');
const outFlag = args.indexOf('--out');
const outOverride = outFlag > -1 ? resolve(args[outFlag + 1]) : null;
const outValueIndex = outFlag > -1 ? outFlag + 1 : -1; // the directory after --out isn't a positional argument
const positional = args.filter((a, i) => !a.startsWith('--') && i !== outValueIndex);
const [sourceName, siteName] = positional;

function availableSources() {
  return existsSync(sourceRoot) ? readdirSync(sourceRoot, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name) : [];
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!sourceName || !siteName) {
  fail('Usage: node tools/process-photos.mjs <source folder> <site folder> [--changed] [--out <dir>]\n' +
    '  e.g. node tools/process-photos.mjs "New zealand" new-zealand\n\n' +
    'Source folders in source-assets/destination-photos/:\n  ' + (availableSources().join('\n  ') || '(none found)'));
}

const sourceDir = join(sourceRoot, sourceName);
if (!existsSync(sourceDir)) {
  fail(`No folder "${sourceName}" in source-assets/destination-photos/.\nAvailable:\n  ${availableSources().join('\n  ') || '(none found)'}`);
}

const files = readdirSync(sourceDir).filter(f => /\.jpe?g$/i.test(f)).sort();
if (!files.length) fail(`No .jpg files found in ${sourceDir}`);

const { Jimp } = await import('jimp').catch(() => fail('The jimp library is not installed. Run "npm install" inside tools/ first.'));

const outDir = outOverride ?? join(repoRoot, 'site', 'assets', 'destinations', siteName);
mkdirSync(outDir, { recursive: true });

const kb = file => statSync(file).size / 1024;
let written = 0;
let skipped = 0;

for (const file of files) {
  // "Düsseldorf.JPG" -> "dusseldorf", "Gold Coast.jpg" -> "gold-coast"
  const slug = file.replace(/\.[^.]+$/, '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const out = join(outDir, `${slug}.jpg`);
  if (changedOnly && existsSync(out) && statSync(join(sourceDir, file)).mtimeMs <= statSync(out).mtimeMs + 2000) {
    skipped++;
    continue;
  }

  const image = await Jimp.read(join(sourceDir, file));
  const { width, height } = image.bitmap;
  if (width < WIDTH) console.warn(`  note: ${file} is only ${width}px wide — it will be enlarged to ${WIDTH}px and may look soft`);

  image.resize({ w: WIDTH });
  let quality = START_QUALITY;
  await image.write(out, { quality });
  while (kb(out) > MAX_KB && quality - QUALITY_STEP >= MIN_QUALITY) {
    quality -= QUALITY_STEP;
    await image.write(out, { quality });
  }

  written++;
  console.log(`${file.padEnd(22)} ${width}x${height} -> ${slug}.jpg  ${image.bitmap.width}x${image.bitmap.height}  q${quality}  ${kb(out).toFixed(0)} KB`);
}

console.log(`\nWrote ${written} photo${written === 1 ? '' : 's'} to ${outDir}` + (skipped ? ` (${skipped} already up to date, left alone)` : ''));
