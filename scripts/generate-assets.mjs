import { mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const accent = '#5b5bd6';
const accentLight = '#8f8fff';
const accentDeep = '#0a0a0d';
const outputDir = resolve(process.cwd(), 'public');
mkdirSync(outputDir, { recursive: true });

const mark = (background, foreground) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="${background}" />
  <path d="M10 11l5 5-5 5" stroke="${foreground}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M17 21h5" stroke="${foreground}" stroke-width="2.6" stroke-linecap="round" />
</svg>`;

const faviconSvg = mark(accent, '#ffffff');
await writeFile(resolve(outputDir, 'favicon.svg'), `${faviconSvg}\n`);

const pngAt = (size) =>
  sharp(Buffer.from(faviconSvg)).resize(size, size).png().toBuffer();

const pngs = new Map();
for (const size of [16, 32, 48, 180, 192, 512]) {
  pngs.set(size, await pngAt(size));
}

await writeFile(resolve(outputDir, 'favicon-16.png'), pngs.get(16));
await writeFile(resolve(outputDir, 'favicon-32.png'), pngs.get(32));
await writeFile(resolve(outputDir, 'apple-touch-icon.png'), pngs.get(180));
await writeFile(resolve(outputDir, 'icon-192.png'), pngs.get(192));
await writeFile(resolve(outputDir, 'icon-512.png'), pngs.get(512));

const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${accentDeep}" />
  <rect x="96" y="96" width="320" height="320" rx="80" fill="${accent}" />
  <g transform="translate(256 256) scale(6.4) translate(-16 -16)">
    <path d="M10 11l5 5-5 5" stroke="#ffffff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M17 21h5" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" />
  </g>
</svg>`;
await sharp(Buffer.from(maskableSvg))
  .png()
  .toFile(resolve(outputDir, 'maskable-512.png'));

function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const directory = Buffer.alloc(images.length * 16);
  let offset = 6 + images.length * 16;

  images.forEach((image, index) => {
    const base = index * 16;
    directory.writeUInt8(image.size, base + 0);
    directory.writeUInt8(image.size, base + 1);
    directory.writeUInt8(0, base + 2);
    directory.writeUInt8(0, base + 3);
    directory.writeUInt16LE(1, base + 4);
    directory.writeUInt16LE(32, base + 6);
    directory.writeUInt32LE(image.png.length, base + 8);
    directory.writeUInt32LE(offset, base + 12);
    offset += image.png.length;
  });

  return Buffer.concat([header, directory, ...images.map((image) => image.png)]);
}

await writeFile(
  resolve(outputDir, 'favicon.ico'),
  buildIco([
    { size: 16, png: pngs.get(16) },
    { size: 32, png: pngs.get(32) },
    { size: 48, png: pngs.get(48) },
  ]),
);

const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="18%" cy="0%" r="85%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.38" />
      <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="${accentDeep}" />
  <rect width="1200" height="630" fill="url(#glow)" />
  <g transform="translate(80, 82)">
    <rect width="46" height="46" rx="13" fill="${accentLight}" />
    <path d="M14 16l9 7-9 7" stroke="${accentDeep}" stroke-width="4.2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M27 31h7" stroke="${accentDeep}" stroke-width="4.2" stroke-linecap="round" />
    <text x="66" y="33" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="600" fill="#f2f2f4">prepbase</text>
  </g>
  <text x="80" y="298" font-family="Segoe UI, Arial, sans-serif" font-size="56" font-weight="600" fill="#f2f2f4">Everything you need to</text>
  <text x="80" y="372" font-family="Segoe UI, Arial, sans-serif" font-size="56" font-weight="600" fill="#f2f2f4">revise for a developer interview.</text>
  <text x="80" y="462" font-family="Segoe UI, Arial, sans-serif" font-size="26" fill="#a9a9b3">JavaScript · React · TypeScript · CSS · Frontend</text>
  <rect x="80" y="512" width="64" height="3" rx="1.5" fill="${accentLight}" />
  <text x="80" y="562" font-family="Segoe UI, Arial, sans-serif" font-size="22" fill="#74747f">Search · Understand · Revise · Move on</text>
</svg>`;
await sharp(Buffer.from(ogSvg)).png().toFile(resolve(outputDir, 'og.png'));

console.log('Generated favicon.svg, ico, png icons, maskable icon and og.png');
