/**
 * Self-contained QR Code generator (byte mode, all versions 1-40, ECC L/M/Q/H).
 * No external dependencies / no CDN — works offline (important for the PWA) and keeps
 * invoice data fully on-device. Algorithm follows the QR Code spec (ISO/IEC 18004).
 *
 * Public API: qrDataURL(text, { ecc, scale, margin, dark, light }) -> PNG data URL.
 */

// ---- Galois field GF(256) with primitive polynomial 0x11D ----
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11D; }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();
const gfMul = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

// ---- ECC tables (indexed [ecl][version], version 1..40; index 0 unused) ----
const ECC_CW_PER_BLOCK = {
  L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  Q: [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  H: [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
};
const NUM_EC_BLOCKS = {
  L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  Q: [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  H: [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
};
const FORMAT_BITS = { L: 1, M: 0, Q: 3, H: 2 };

function rawDataModules(ver) {
  let result = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const numAlign = Math.floor(ver / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (ver >= 7) result -= 36;
  }
  return result;
}
const dataCodewords = (ver, ecl) => Math.floor(rawDataModules(ver) / 8) - ECC_CW_PER_BLOCK[ecl][ver] * NUM_EC_BLOCKS[ecl][ver];

function alignmentPositions(ver) {
  if (ver === 1) return [];
  const numAlign = Math.floor(ver / 7) + 2;
  const step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (numAlign * 2 - 2)) * 2;
  const result = [6];
  for (let pos = ver * 4 + 10; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
  return result;
}

// ---- Reed-Solomon ----
function rsDivisor(degree) {
  const result = new Uint8Array(degree); result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = gfMul(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
    root = gfMul(root, 2);
  }
  return result;
}
function rsRemainder(data, divisor) {
  const result = new Uint8Array(divisor.length);
  for (const b of data) {
    const factor = b ^ result[0];
    result.copyWithin(0, 1); result[result.length - 1] = 0;
    for (let i = 0; i < result.length; i++) result[i] ^= gfMul(divisor[i], factor);
  }
  return result;
}

// ---- Bit buffer ----
function appendBits(arr, val, len) { for (let i = len - 1; i >= 0; i--) arr.push((val >>> i) & 1); }

function encodeByteMode(text, ecl) {
  const bytes = new TextEncoder().encode(text);
  // choose smallest version that fits
  let version = 0;
  for (let v = 1; v <= 40; v++) {
    const ccBits = v <= 9 ? 8 : 16;
    const cap = dataCodewords(v, ecl) * 8;
    const needed = 4 + ccBits + bytes.length * 8;
    if (needed <= cap) { version = v; break; }
  }
  if (!version) throw new Error('QR: البيانات أكبر من السعة القصوى');

  const ccBits = version <= 9 ? 8 : 16;
  const bits = [];
  appendBits(bits, 0b0100, 4); // byte mode
  appendBits(bits, bytes.length, ccBits);
  for (const b of bytes) appendBits(bits, b, 8);

  const capacityBits = dataCodewords(version, ecl) * 8;
  appendBits(bits, 0, Math.min(4, capacityBits - bits.length)); // terminator
  while (bits.length % 8 !== 0) bits.push(0);
  for (let pad = 0xEC; bits.length < capacityBits; pad ^= 0xEC ^ 0x11) appendBits(bits, pad, 8);

  // to codewords
  const dataCw = new Uint8Array(bits.length / 8);
  for (let i = 0; i < dataCw.length; i++) for (let j = 0; j < 8; j++) dataCw[i] |= bits[i * 8 + j] << (7 - j);

  return { version, dataCw };
}

function interleave(dataCw, ver, ecl) {
  const numBlocks = NUM_EC_BLOCKS[ecl][ver];
  const blockEccLen = ECC_CW_PER_BLOCK[ecl][ver];
  const rawCw = Math.floor(rawDataModules(ver) / 8);
  const numShort = numBlocks - (rawCw % numBlocks);
  const shortLen = Math.floor(rawCw / numBlocks);

  const blocks = [];
  const divisor = rsDivisor(blockEccLen);
  let k = 0;
  for (let i = 0; i < numBlocks; i++) {
    const datLen = shortLen - blockEccLen + (i < numShort ? 0 : 1);
    const dat = dataCw.slice(k, k + datLen); k += datLen;
    const ecc = rsRemainder(dat, divisor);
    blocks.push({ dat, ecc });
  }
  const result = [];
  const maxData = Math.max(...blocks.map((b) => b.dat.length));
  for (let i = 0; i < maxData; i++) for (let b = 0; b < blocks.length; b++) if (i < blocks[b].dat.length) result.push(blocks[b].dat[i]);
  for (let i = 0; i < blockEccLen; i++) for (let b = 0; b < blocks.length; b++) result.push(blocks[b].ecc[i]);
  return result;
}

// ---- Matrix ----
function buildMatrix(allCw, ver, ecl) {
  const size = ver * 4 + 17;
  const modules = Array.from({ length: size }, () => new Int8Array(size).fill(-1)); // -1 = unset (function-free)
  const isFn = Array.from({ length: size }, () => new Uint8Array(size));

  const setFn = (x, y, dark) => { if (x >= 0 && y >= 0 && x < size && y < size) { modules[y][x] = dark ? 1 : 0; isFn[y][x] = 1; } };

  // finder + separators
  const finder = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const dist = Math.max(Math.abs(dx), Math.abs(dy));
      setFn(cx + dx, cy + dy, dist !== 2 && dist !== 4);
    }
  };
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4);

  // timing
  for (let i = 0; i < size; i++) { if (!isFn[6][i]) setFn(i, 6, i % 2 === 0); if (!isFn[i][6]) setFn(6, i, i % 2 === 0); }

  // alignment
  const pos = alignmentPositions(ver);
  for (let i = 0; i < pos.length; i++) for (let j = 0; j < pos.length; j++) {
    if ((i === 0 && j === 0) || (i === 0 && j === pos.length - 1) || (i === pos.length - 1 && j === 0)) continue;
    const cx = pos[j], cy = pos[i];
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) setFn(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }

  // reserve format (around finders) & version areas as function (filled later)
  for (let i = 0; i < 9; i++) { setFn(i, 8, false); setFn(8, i, false); }
  for (let i = 0; i < 8; i++) { setFn(size - 1 - i, 8, false); setFn(8, size - 1 - i, false); }
  setFn(8, size - 8, true); // dark module
  if (ver >= 7) {
    for (let i = 0; i < 18; i++) { const a = Math.floor(i / 3), b = i % 3; setFn(size - 11 + b, a, false); setFn(a, size - 11 + b, false); }
  }

  // place data (zigzag)
  let bitIdx = 0;
  const totalBits = allCw.length * 8;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!isFn[y][x] && modules[y][x] === -1) {
          let dark = 0;
          if (bitIdx < totalBits) { dark = (allCw[bitIdx >>> 3] >>> (7 - (bitIdx & 7))) & 1; bitIdx++; }
          modules[y][x] = dark;
        }
      }
    }
  }

  return { modules, isFn, size };
}

const MASK_FN = [
  (x, y) => (x + y) % 2 === 0,
  (x, y) => y % 2 === 0,
  (x, y) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

function applyMask({ modules, isFn, size }, mask) {
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!isFn[y][x] && MASK_FN[mask](x, y)) modules[y][x] ^= 1;
}

function drawFormat({ modules, size }, ecl, mask) {
  const data = (FORMAT_BITS[ecl] << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412;
  const get = (i) => (bits >>> i) & 1;
  for (let i = 0; i <= 5; i++) modules[8][i] = get(i);
  modules[8][7] = get(6); modules[8][8] = get(7); modules[7][8] = get(8);
  for (let i = 9; i < 15; i++) modules[14 - i][8] = get(i);
  for (let i = 0; i < 8; i++) modules[size - 1 - i][8] = get(i);
  for (let i = 8; i < 15; i++) modules[8][size - 15 + i] = get(i);
  modules[size - 8][8] = 1; // dark module
}

function drawVersion({ modules, size }, ver) {
  if (ver < 7) return;
  let rem = ver;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
  const bits = (ver << 12) | rem;
  for (let i = 0; i < 18; i++) {
    const bit = (bits >>> i) & 1; const a = Math.floor(i / 3), b = i % 3;
    modules[a][size - 11 + b] = bit; modules[size - 11 + b][a] = bit;
  }
}

function penalty({ modules, size }) {
  let p = 0;
  // rule 1: runs of 5+
  for (let y = 0; y < size; y++) {
    let runColor = modules[y][0], runLen = 1;
    for (let x = 1; x < size; x++) { if (modules[y][x] === runColor) { runLen++; if (runLen === 5) p += 3; else if (runLen > 5) p++; } else { runColor = modules[y][x]; runLen = 1; } }
  }
  for (let x = 0; x < size; x++) {
    let runColor = modules[0][x], runLen = 1;
    for (let y = 1; y < size; y++) { if (modules[y][x] === runColor) { runLen++; if (runLen === 5) p += 3; else if (runLen > 5) p++; } else { runColor = modules[y][x]; runLen = 1; } }
  }
  // rule 2: 2x2 blocks
  for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) { const c = modules[y][x]; if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) p += 3; }
  // rule 3: finder-like patterns
  const pat1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], pat2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  const lineHas = (get) => {
    let cnt = 0;
    for (let i = 0; i <= size - 11; i++) {
      let m1 = true, m2 = true;
      for (let k = 0; k < 11; k++) { if (get(i + k) !== pat1[k]) m1 = false; if (get(i + k) !== pat2[k]) m2 = false; }
      if (m1 || m2) cnt++;
    }
    return cnt;
  };
  for (let y = 0; y < size; y++) p += 40 * lineHas((i) => modules[y][i]);
  for (let x = 0; x < size; x++) p += 40 * lineHas((i) => modules[i][x]);
  // rule 4: balance
  let dark = 0; for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) dark += modules[y][x];
  const ratio = dark / (size * size);
  p += Math.floor(Math.abs(ratio * 20 - 10)) * 10;
  return p;
}

/** Generate a QR matrix (2D array of 0/1). */
export function qrMatrix(text, ecl = 'M') {
  const { version, dataCw } = encodeByteMode(text, ecl);
  const allCw = interleave(dataCw, version, ecl);

  let best = null, bestPenalty = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const m = buildMatrix(allCw, version, ecl);
    applyMask(m, mask);
    drawFormat(m, ecl, mask);
    drawVersion(m, version);
    const pen = penalty(m);
    if (pen < bestPenalty) { bestPenalty = pen; best = m; }
  }
  return best.modules.map((row) => Array.from(row, (v) => (v === 1 ? 1 : 0)));
}

/** Render QR to a PNG data URL. */
export function qrDataURL(text, { ecc = 'M', scale = 8, margin = 4, dark = '#000000', light = '#ffffff' } = {}) {
  const matrix = qrMatrix(text, ecc);
  const n = matrix.length;
  const dim = (n + margin * 2) * scale;
  const canvas = document.createElement('canvas');
  canvas.width = dim; canvas.height = dim;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = light; ctx.fillRect(0, 0, dim, dim);
  ctx.fillStyle = dark;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (matrix[y][x]) ctx.fillRect((x + margin) * scale, (y + margin) * scale, scale, scale);
  return canvas.toDataURL('image/png');
}
