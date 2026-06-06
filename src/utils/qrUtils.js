/**
 * QR helpers — including ZATCA (Saudi e-invoice) TLV base64 decoding so that when we
 * re-draw a QR from extracted content we can preserve the *original* payload.
 */

/** Lazy-load a UMD script from a CDN once. Resolves when window[globalName] exists. */
const _loaded = new Map();
export function loadScript(url) {
  if (_loaded.has(url)) return _loaded.get(url);
  const p = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = url; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${url}`));
    document.head.appendChild(s);
  });
  _loaded.set(url, p);
  return p;
}

/**
 * Decode a ZATCA TLV base64 QR payload into readable tags.
 * Tags: 1=Seller, 2=VAT number, 3=Timestamp, 4=Total, 5=VAT total.
 */
export function decodeZatcaTLV(base64) {
  try {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const out = {};
    let i = 0;
    while (i < bytes.length) {
      const tag = bytes[i++];
      const len = bytes[i++];
      const val = new TextDecoder('utf-8').decode(bytes.slice(i, i + len));
      i += len;
      out[tag] = val;
    }
    return {
      seller: out[1], vatNumber: out[2], timestamp: out[3],
      total: out[4], vatTotal: out[5], raw: out,
    };
  } catch {
    return null; // not a TLV payload; keep raw content as-is
  }
}
