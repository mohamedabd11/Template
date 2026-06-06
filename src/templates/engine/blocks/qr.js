/**
 * QR block variants — different framing/placement for the QR code.
 * The QR IMAGE is provided by the invoice (uploaded, decoded, or re-rendered upstream by
 * QrService). This block only presents it; it never invents a new payload here.
 */
import { esc } from '../../../utils/dom.js';
import { T } from '../labels.js';

function img(c) {
  if (c.qr.imageDataUrl) return `<img class="qr-img" src="${esc(c.qr.imageDataUrl)}" alt="QR">`;
  // Placeholder when no QR is available yet.
  return `<div class="qr-placeholder">QR</div>`;
}

export const qrBlocks = {
  framed: (c) => `<div class="qr qr--framed"><div class="qr-frame">${img(c)}</div></div>`,

  plain: (c) => `<div class="qr qr--plain">${img(c)}</div>`,

  'circle-badge': (c) => `<div class="qr qr--circle"><div class="qr-circle">${img(c)}</div></div>`,

  corner: (c) => `<div class="qr qr--corner">${img(c)}<span class="qr-corner-tag">${T.scanVerify[0]} · ${T.scanVerify[1]}</span></div>`,

  captioned: (c) => `
    <div class="qr qr--captioned">
      ${img(c)}
      <div class="qr-caption">${T.scanCaption[0]}<br>${T.scanCaption[1]}</div>
    </div>`,

  // ZATCA: QR + invoice UUID + transaction code (+ scan note), as printed by the system.
  zatca: (c) => `
    <div class="qr qr--zatca">
      ${img(c)}
      ${c.invoice.uuid ? `<div class="qr-uuid">${esc(c.invoice.uuid)}</div>` : ''}
      ${c.invoice.transactionCode ? `<div class="qr-txcode">Invoice Transaction Code: ${esc(c.invoice.transactionCode)}</div>` : ''}
      <div class="qr-caption">${T.scanCaption[1]}<br>${T.scanCaption[0]}</div>
    </div>`,
};
