import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import QRCode from 'qrcode';

// Makes site/assets/whatsapp-channel-qr.svg, the QR code for the company's
// WhatsApp channel shown in every page's footer and in the home page's
// "Never miss an intake" band. Scanning it with a phone camera opens the
// channel in WhatsApp (Follow for someone new, the channel itself for someone
// who already follows it).
//
//   node tools/make-whatsapp-qr.mjs
//
// If the channel link ever changes, change CHANNEL_URL here, run this, and
// change the same link in the pages (search the site for "whatsapp.com/channel").
//
// Built once, here, rather than by a QR service in the visitor's browser: the
// page needs nothing from anyone else, and the code never changes unless the
// link does. Error correction H (the highest) lets the WhatsApp logo sit over
// the middle of the code (the pages put it there) and it still scans.

const CHANNEL_URL = 'https://whatsapp.com/channel/0029Va5Kk4G5EjxtRf1n7B0r';
const NAVY = '#001B5E';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, '..', 'site', 'assets', 'whatsapp-channel-qr.svg');

// navy squares on a transparent ground: the pages set the white card behind
// it (with room round it), so it reads on the light page and the navy footer
const svg = await QRCode.toString(CHANNEL_URL, {
  type: 'svg',
  errorCorrectionLevel: 'H',
  margin: 0,
  color: { dark: NAVY, light: '#0000' },
});
writeFileSync(out, svg.trim() + '\n', 'utf8');
console.log(`wrote ${out} for ${CHANNEL_URL}`);
