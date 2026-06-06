/**
 * Generates PWA raster icons (PNG) with no external dependencies, using Node's zlib.
 * Draws a rounded indigo→violet gradient tile with a simple white "invoice" mark, matching
 * icon.svg. Outputs icon-192.png, icon-512.png, maskable-512.png, apple-touch-icon.png.
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'icons');

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function png(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit, RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function lerp(a, b, t) { return Math.round(a + (b - a) * t); }
function draw(size, { maskable = false } = {}) {
  const buf = Buffer.alloc(size * size * 4);
  const radius = maskable ? 0 : size * 0.22; // maskable = full bleed, no rounded corners
  const set = (x, y, r, g, b, a = 255) => { const i = (y * size + x) * 4; buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a; };
  const inRound = (x, y) => {
    if (radius === 0) return true;
    const rx = Math.min(x, size - 1 - x), ry = Math.min(y, size - 1 - y);
    if (rx >= radius || ry >= radius) return true;
    const dx = radius - rx, dy = radius - ry;
    return dx * dx + dy * dy <= radius * radius;
  };
  // background gradient (indigo -> violet) diagonally
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!inRound(x, y)) { set(x, y, 0, 0, 0, 0); continue; }
      const t = (x + y) / (2 * size);
      set(x, y, lerp(99, 139, t), lerp(102, 92, t), lerp(241, 246, t));
    }
  }
  // white document rectangle
  const dx0 = Math.round(size * 0.29), dx1 = Math.round(size * 0.71);
  const dy0 = Math.round(size * 0.23), dy1 = Math.round(size * 0.77);
  const rect = (x0, y0, x1, y1, r, g, b) => {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (x >= 0 && y >= 0 && x < size && y < size && inRound(x, y)) set(x, y, r, g, b);
  };
  rect(dx0, dy0, dx1, dy1, 255, 255, 255);
  // accent lines
  const u = size / 512;
  rect(Math.round(182 * u), Math.round(166 * u), Math.round(330 * u), Math.round(188 * u), 99, 102, 241);
  rect(Math.round(182 * u), Math.round(208 * u), Math.round(330 * u), Math.round(220 * u), 203, 213, 225);
  rect(Math.round(182 * u), Math.round(232 * u), Math.round(302 * u), Math.round(244 * u), 203, 213, 225);
  rect(Math.round(182 * u), Math.round(256 * u), Math.round(330 * u), Math.round(268 * u), 203, 213, 225);
  rect(Math.round(182 * u), Math.round(316 * u), Math.round(330 * u), Math.round(356 * u), 139, 92, 246);
  return png(size, size, buf);
}

writeFileSync(resolve(OUT, 'icon-192.png'), draw(192));
writeFileSync(resolve(OUT, 'icon-512.png'), draw(512));
writeFileSync(resolve(OUT, 'maskable-512.png'), draw(512, { maskable: true }));
writeFileSync(resolve(OUT, 'apple-touch-icon.png'), draw(180));
console.log('Generated PWA icons (192, 512, maskable, apple-touch).');
