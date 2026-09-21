import { existsSync, mkdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { Jimp, ResizeStrategy } from 'jimp';

// Makes the small square head-and-shoulders portraits used on the "Book Free
// Consultation" cards, one per person, from the full team photos.
//
//   node tools/make-team-thumbs.mjs               write site/assets/team/thumbs/<id>.jpg
//   node tools/make-team-thumbs.mjs --out <dir>   write them somewhere else (to preview)
//
// Why not just shrink the big photo in the browser? The full portraits are
// 960x1200 and 4:5, so squeezing one into a small square crops the top of the
// head off and leaves the face tiny. These are framed on purpose — the eyes sit
// at the same height on every card, with room above the hair — and made at 240px
// so they stay sharp on high-density phone screens (shown at ~96px).
//
// The framing numbers are pixel positions in each 960x1200 team photo:
//   eye  = height of the eyes, headTop = top of the hair (or hairstyle).
// If a new team photo is added (or one is re-cropped), add or adjust its row,
// run this, and look at the result.

const SIZE = 240;          // output edge, px (shown at ~96 CSS px, so 2.5x)
const SIDE = 600;          // edge of the square cut from the 960x1200 photo
const EYE_AT = 0.40;       // eyes sit this far down the square...
const HEADROOM = 34;       // ...but never leave less than this above the hair

const framing = {
  'beatrice':       { eye: 384, headTop: 222 },
  'canisius-yego':  { eye: 384, headTop: 180 },
  'collins':        { eye: 384, headTop: 168 },
  'dennis':         { eye: 360, headTop: 160 },
  'evelyne-choge':  { eye: 396, headTop: 224 },
  'joy':            { eye: 384, headTop: 175 },
  'joyner':         { eye: 384, headTop: 204 },
  'mourine':        { eye: 384, headTop: 262 },
  'rahab':          { eye: 372, headTop: 150 },
  'tebby':          { eye: 372, headTop: 100 },
  'tina':           { eye: 408, headTop: 60 },
  'witney':         { eye: 384, headTop: 203 },
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const teamDir = join(__dirname, '..', 'site', 'assets', 'team');
const args = process.argv.slice(2);
const outFlag = args.indexOf('--out');
const outDir = outFlag > -1 ? resolve(args[outFlag + 1]) : join(teamDir, 'thumbs');
mkdirSync(outDir, { recursive: true });

for (const [id, f] of Object.entries(framing)) {
  const src = join(teamDir, `${id}.jpg`);
  if (!existsSync(src)) { console.error(`missing ${id}.jpg — skipped`); continue; }
  const img = await Jimp.read(src);
  const { width, height } = img.bitmap;

  // Square whose top is chosen from the eye line, then raised if needed so the hair isn't clipped.
  // A tall hairstyle can need a bigger square; grow it (keeping the eyes where they are) until it fits.
  let side = SIDE;
  let top = Math.round(f.eye - EYE_AT * side);
  if (top > f.headTop - HEADROOM) top = f.headTop - HEADROOM;
  if (top < 0) { top = 0; }
  const need = f.eye - top + 0.60 * SIDE; // keep the same amount of shoulder below the eyes
  side = Math.min(Math.round(Math.max(SIDE, need)), width, height - top);
  const left = Math.max(0, Math.min(Math.round(width / 2 - side / 2), width - side));

  img.crop({ x: left, y: top, w: side, h: side });
  img.resize({ w: SIZE, h: SIZE, mode: ResizeStrategy.BICUBIC });
  const out = join(outDir, `${id}.jpg`);
  await img.write(out, { quality: 84 });
  console.log(`${id.padEnd(15)} crop ${side}px square at (${left},${top}) -> ${SIZE}px  ${(statSync(out).size / 1024).toFixed(0)} KB`);
}
console.log(`\nWrote ${Object.keys(framing).length} portraits to ${outDir}`);
