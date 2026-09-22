import { mkdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { Jimp, ResizeStrategy } from 'jimp';
import { countries } from './generate-countries.mjs';

// Makes the pictures that appear when a page is shared on WhatsApp, Facebook,
// LinkedIn and similar: one per destination (its lead city photo) plus a branded
// default for every other page.
//
//   node tools/make-share-images.mjs               write site/assets/share/<name>.jpg
//   node tools/make-share-images.mjs --out <dir>   write them somewhere else (to preview)
//
// 1200x630 is the shape those sites expect, and each file is kept well under
// 300 KB (WhatsApp skips large previews). A destination's image is its first
// city photo — reorder that country's `partners` list in generate-countries.mjs
// to change it — cropped to fit (a city's `position: 'center bottom'` is
// honoured), with the bottom darkened a little and the logo added.

const W = 1200;
const H = 630;
const NAVY = [0, 18, 56];      // #001238, the darker end of the site's gradient
const BLUE = [0, 27, 94];      // --ink

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteDir = join(__dirname, '..', 'site');
const args = process.argv.slice(2);
const outFlag = args.indexOf('--out');
const outDir = outFlag > -1 ? resolve(args[outFlag + 1]) : join(siteDir, 'assets', 'share');
mkdirSync(outDir, { recursive: true });

const logo = await Jimp.read(join(siteDir, 'assets', 'logo-mark.png'));

// scale to cover W x H, then crop; `position` picks which part of the overflow is kept
async function cover(file, position = '') {
  const img = await Jimp.read(file);
  const scale = Math.max(W / img.bitmap.width, H / img.bitmap.height);
  img.resize({ w: Math.ceil(img.bitmap.width * scale), h: Math.ceil(img.bitmap.height * scale), mode: ResizeStrategy.BICUBIC });
  const x = Math.round((img.bitmap.width - W) / 2);
  const spare = img.bitmap.height - H;
  const y = /bottom/.test(position) ? spare : /top/.test(position) ? 0 : Math.round(spare / 2);
  img.crop({ x, y, w: W, h: H });
  return img;
}

// blend a colour over a row band with strength rising from 0 (top of band) to `max` (bottom)
function fadeToColour(img, fromY, colour, max) {
  const { data, width, height } = img.bitmap;
  for (let y = fromY; y < height; y++) {
    const a = max * ((y - fromY) / (height - fromY));
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) data[i + c] = Math.round(data[i + c] * (1 - a) + colour[c] * a);
    }
  }
}

// The mark's dark-blue half vanishes on dark photos, so it sits on a white rounded
// tile — the same treatment as the logo in the site header.
function tile(w, h, radius) {
  const t = new Jimp({ width: w, height: h, color: 0xffffffff });
  const { data } = t.bitmap;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x < radius ? radius - x - 0.5 : x >= w - radius ? x - (w - radius) + 0.5 : 0;
      const dy = y < radius ? radius - y - 0.5 : y >= h - radius ? y - (h - radius) + 0.5 : 0;
      if (dx * dx + dy * dy > radius * radius) data[(y * w + x) * 4 + 3] = 0;
    }
  }
  return t;
}

// draws the logo (width `markWidth`) on its tile; (x, y) is the tile's top-left corner
function stampLogo(img, markWidth, x, y) {
  const mark = logo.clone();
  mark.resize({ w: markWidth, mode: ResizeStrategy.BICUBIC });
  const pad = Math.round(markWidth * 0.14);
  const plate = tile(mark.bitmap.width + pad * 2, mark.bitmap.height + pad * 2, Math.round(markWidth * 0.14));
  img.composite(plate, x, y);
  img.composite(mark, x + pad, y + pad);
  return plate.bitmap;
}

async function save(img, name) {
  const out = join(outDir, `${name}.jpg`);
  await img.write(out, { quality: 82 });
  console.log(`${name.padEnd(16)} ${W}x${H}  ${(statSync(out).size / 1024).toFixed(0)} KB`);
}

for (const c of countries) {
  const lead = c.partners[0];
  if (!lead) { console.warn(`${c.slug}: no city photo yet — skipped`); continue; }
  const img = await cover(join(siteDir, lead.photo), lead.position);
  fadeToColour(img, Math.round(H * 0.5), NAVY, 0.7);
  const tileH = Math.round(150 * logo.bitmap.height / logo.bitmap.width) + 2 * Math.round(150 * 0.14);
  stampLogo(img, 150, 48, H - 48 - tileH);
  await save(img, c.slug);
}

// default: the site's navy with the logo in the middle
{
  const img = new Jimp({ width: W, height: H, color: 0x001238ff });
  const { data } = img.bitmap;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = (x / W + y / H) / 2; // diagonal from the dark to the lighter navy
      const i = (y * W + x) * 4;
      for (let c = 0; c < 3; c++) data[i + c] = Math.round(NAVY[c] * (1 - t) + BLUE[c] * t);
    }
  }
  const w = 300;
  const pad = Math.round(w * 0.14);
  const tileW = w + 2 * pad;
  const tileH = Math.round(w * logo.bitmap.height / logo.bitmap.width) + 2 * pad;
  stampLogo(img, w, Math.round((W - tileW) / 2), Math.round((H - tileH) / 2));
  await save(img, 'default');
}
console.log(`\nWrote to ${outDir}`);
