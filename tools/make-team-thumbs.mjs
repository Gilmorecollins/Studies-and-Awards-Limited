import { existsSync, mkdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { Jimp, ResizeStrategy } from 'jimp';

// Makes the framed head-and-shoulders portraits cut from the full team photos:
//   thumbs/<id>.jpg  small squares (the Team page's journey stops)
//   cards/<id>.jpg   5:4 portraits for the "Book Free Consultation" cards
//
//   node tools/make-team-thumbs.mjs               write both into site/assets/team/
//   node tools/make-team-thumbs.mjs --out <dir>   write them somewhere else (to preview)
//
// Why not just shrink the big photo in the browser? The full portraits are
// 960x1200 and 4:5, so squeezing one into a small square crops the top of the
// head off and leaves the face tiny. These are framed on purpose — the eyes sit
// at the same height on every card, with room above the hair — and made at 240px
// so they stay sharp on high-density phone screens (shown at ~96px).
//
// The framing numbers are pixel positions in each 960x1200 team photo:
//   eye  = height of the eyes, headTop = top of the hair (or hairstyle),
//   cardW = optional wider crop for the consultation card when the person
//           stands closer to the camera than most (default 720).
// If a new team photo is added (or one is re-cropped), add or adjust its row,
// run this, and look at the result.

const SIZE = 240;          // output edge, px (shown at ~96 CSS px, so 2.5x)
const SIDE = 600;          // edge of the square cut from the 960x1200 photo
const EYE_AT = 0.40;       // eyes sit this far down the square...
const HEADROOM = 34;       // ...but never leave less than this above the hair

const framing = {
  'beatrice':       { eye: 384, headTop: 222 },
  'bethwel':        { eye: 388, headTop: 210 },
  'canisius-yego':  { eye: 384, headTop: 180 },
  'collins':        { eye: 384, headTop: 168, cardW: 840 },
  'dennis':         { eye: 360, headTop: 160 },
  'evelyne-choge':  { eye: 396, headTop: 224 },
  'ian':            { eye: 325, headTop: 98, cardW: 860 },
  'joy':            { eye: 384, headTop: 175, cardW: 800 },
  'joyner':         { eye: 384, headTop: 204 },
  'karen':          { eye: 408, headTop: 188 },
  'miki':           { eye: 408, headTop: 155 },
  'mourine':        { eye: 384, headTop: 262 },
  'rahab':          { eye: 372, headTop: 150 },
  'talaam':         { eye: 282, headTop: 75 },
  'tebby':          { eye: 372, headTop: 100 },
  'tina':           { eye: 408, headTop: 60, cardW: 960 },
  'winnie':         { eye: 380, headTop: 158, cardW: 920 },
  'witney':         { eye: 384, headTop: 203, cardW: 800 },
};

// The consultation cards show a wider, landscape crop: shoulders and a little
// background either side, eyes a bit above the middle. 480x384 is 2x the
// ~240px card width.
const CARD = { w: 480, h: 384, cropW: 720, eyeAt: 0.44, headroom: 40 };

const __dirname = dirname(fileURLToPath(import.meta.url));
const teamDir = join(__dirname, '..', 'site', 'assets', 'team');
const args = process.argv.slice(2);
const outFlag = args.indexOf('--out');
const outRoot = outFlag > -1 ? resolve(args[outFlag + 1]) : teamDir;
const thumbDir = join(outRoot, 'thumbs');
const cardDir = join(outRoot, 'cards');
mkdirSync(thumbDir, { recursive: true });
mkdirSync(cardDir, { recursive: true });

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

  const thumb = img.clone();
  thumb.crop({ x: left, y: top, w: side, h: side });
  thumb.resize({ w: SIZE, h: SIZE, mode: ResizeStrategy.BICUBIC });
  const out = join(thumbDir, `${id}.jpg`);
  await thumb.write(out, { quality: 84 });

  // Card: fixed-width landscape crop, eyes at CARD.eyeAt, raised if the hair would be clipped.
  const cw = Math.min(f.cardW || CARD.cropW, width);
  const ch = Math.round(cw * CARD.h / CARD.w);
  let ctop = Math.round(f.eye - CARD.eyeAt * ch);
  if (ctop > f.headTop - CARD.headroom) ctop = f.headTop - CARD.headroom;
  ctop = Math.max(0, Math.min(ctop, height - ch));
  const cleft = Math.round((width - cw) / 2);
  const card = img.clone();
  card.crop({ x: cleft, y: ctop, w: cw, h: ch });
  card.resize({ w: CARD.w, h: CARD.h, mode: ResizeStrategy.BICUBIC });
  const cardOut = join(cardDir, `${id}.jpg`);
  await card.write(cardOut, { quality: 80 });

  console.log(`${id.padEnd(15)} thumb ${side}px at (${left},${top}) ${(statSync(out).size / 1024).toFixed(0)} KB · card ${cw}x${ch} at (${cleft},${ctop}) ${(statSync(cardOut).size / 1024).toFixed(0)} KB`);
}
console.log(`\nWrote ${Object.keys(framing).length} thumbs and cards to ${outRoot}`);
