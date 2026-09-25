import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Jimp, ResizeStrategy } from 'jimp';

// Makes the smaller copies of the city photos used on the destination pages,
// from the full-size slideshow photos:
//   editorial/<city>.jpg  900px wide: the photo collage and "how we help" photo
//   thumbs/<city>.jpg     320px wide: small thumbnails (no page uses these now: the
//                         slideshow's city markers are plain progress bars)
//
//   node tools/make-editorial-photos.mjs          make any that are missing or out of date
//   node tools/make-editorial-photos.mjs --all    remake every one
//
// It reads which photos the pages actually use: every
//   assets/destinations/<country>/(editorial|thumbs)/<city>.jpg
// referenced from a site/*.html page is made from
//   assets/destinations/<country>/<city>.jpg
// So run it after generate-countries.mjs whenever the photo choices change
// (generate-countries.mjs --check reports any that are missing).
//
// Why not reuse the slideshow photos? Those are 1920px wide and up to ~500 KB
// each; the editorial spots show them at most ~400px wide (800px on high-density
// screens), so a 900px copy looks the same and is a fraction of the weight.

const SIZES = { editorial: { width: 900, quality: 70 }, thumbs: { width: 320, quality: 72 } };

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteDir = join(__dirname, '..', 'site');
const all = process.argv.includes('--all');

const wanted = new Set();
for (const file of readdirSync(siteDir).filter(f => f.endsWith('.html'))) {
  const html = readFileSync(join(siteDir, file), 'utf8');
  for (const m of html.matchAll(/assets\/destinations\/[\w-]+\/(?:editorial|thumbs)\/[\w-]+\.jpg/g)) wanted.add(m[0]);
}

let made = 0;
for (const rel of [...wanted].sort()) {
  const out = join(siteDir, rel);
  const kind = rel.includes('/thumbs/') ? 'thumbs' : 'editorial';
  const { width, quality } = SIZES[kind];
  const src = out.replace(`/${kind}/`, '/');
  if (!existsSync(src)) { console.error(`missing source photo for ${rel} — skipped`); continue; }
  if (!all && existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs) continue;
  mkdirSync(dirname(out), { recursive: true });
  const img = await Jimp.read(src);
  if (img.bitmap.width > width) img.resize({ w: width, mode: ResizeStrategy.BICUBIC });
  await img.write(out, { quality });
  made++;
  console.log(`${rel.padEnd(58)} ${img.bitmap.width}x${img.bitmap.height}  ${(statSync(out).size / 1024).toFixed(0)} KB`);
}
console.log(`\n${wanted.size} smaller photos in use, ${made} written.`);
