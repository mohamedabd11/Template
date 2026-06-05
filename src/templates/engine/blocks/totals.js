/**
 * Totals block variants — different ways to present the summary/grand total.
 * Always reflects the invoice's (possibly original) figures; never recomputes source totals.
 */
import { esc } from '../../../utils/dom.js';
import { bl, blText, T } from '../labels.js';

function lines(c) {
  const inv = c.invoice;
  const rows = [
    [bl('subtotal'), c.money(inv.subtotal)],
    inv.discountTotal ? [bl('discount'), `- ${c.money(inv.discountTotal)}`] : null,
    [bl('vat15'), c.money(inv.taxTotal)],
  ].filter(Boolean);
  return rows;
}

function inWords(c) {
  return `<div class="tot-words"><span>${blText('amountInWords')}:</span> ${esc(c.tafqeet(c.invoice.grandTotal))}</div>`;
}

const DUE = bl('totalDue');

export const totalsBlocks = {
  // Boxed block aligned to the right with a highlighted grand-total row.
  'boxed-right': (c) => `
    <div class="tot tot--boxed">
      ${lines(c).map(([k, v]) => `<div class="tot-line"><span>${k}</span><b>${v}</b></div>`).join('')}
      <div class="tot-grand"><span>${DUE}</span><b>${c.money(c.invoice.grandTotal)}</b></div>
      ${inWords(c)}
    </div>`,

  // Card with grand total as a big number at the top.
  'stacked-card': (c) => `
    <div class="tot tot--card">
      <div class="tot-card-grand">
        <div class="tot-card-label">${DUE}</div>
        <div class="tot-card-value">${c.money(c.invoice.grandTotal)}</div>
      </div>
      <div class="tot-card-lines">
        ${lines(c).map(([k, v]) => `<div class="tot-line"><span>${k}</span><b>${v}</b></div>`).join('')}
      </div>
      ${inWords(c)}
    </div>`,

  // Full-width accent bar emphasizing the total.
  'highlight-bar': (c) => `
    <div class="tot tot--bar">
      <div class="tot-bar-lines">
        ${lines(c).map(([k, v]) => `<div class="tot-line"><span>${k}</span><b>${v}</b></div>`).join('')}
      </div>
      <div class="tot-bar-grand"><span>${DUE}</span><b>${c.money(c.invoice.grandTotal)}</b></div>
      ${inWords(c)}
    </div>`,

  // Accounting ledger look (ruled lines, double underline on total).
  ledger: (c) => `
    <div class="tot tot--ledger">
      <table>
        ${lines(c).map(([k, v]) => `<tr><td>${k}</td><td class="tot-num">${v}</td></tr>`).join('')}
        <tr class="tot-ledger-grand"><td>${DUE}</td><td class="tot-num">${c.money(c.invoice.grandTotal)}</td></tr>
      </table>
      ${inWords(c)}
    </div>`,

  // ZATCA statement: stacked bilingual bordered rows (Total / Discount / Taxable / VAT /
  // Gross / Balance Due) with the amount in words.
  statement: (c) => {
    const inv = c.invoice;
    const taxable = inv.subtotal - inv.discountTotal;
    const rows = [
      [T.totalAmount, c.money(inv.subtotal, false)],
      [T.totalDiscount, c.money(inv.discountTotal, false)],
      [T.taxableAmount, c.money(taxable, false)],
      [T.vatTotalAmount, c.money(inv.taxTotal, false)],
      [T.grossTotal, c.money(inv.grandTotal, false), 'is-gross'],
      [T.balanceDue, c.money(inv.grandTotal, false), 'is-balance'],
    ];
    return `
      <div class="tot tot--statement">
        ${rows.map(([lbl, val, cls]) => `<div class="st-row ${cls || ''}">
          <span class="st-en">${lbl[1]} (SAR)</span>
          <span class="st-val">${val}</span>
          <span class="st-ar">${lbl[0]} (ر.س)</span></div>`).join('')}
        <div class="st-words"><span>${blText('amountInWords')}:</span> ${esc(c.tafqeet(inv.grandTotal))}</div>
      </div>`;
  },

  // Gold-framed luxury totals.
  'gold-frame': (c) => `
    <div class="tot tot--gold">
      <div class="tot-gold-inner">
        ${lines(c).map(([k, v]) => `<div class="tot-line"><span>${k}</span><b>${v}</b></div>`).join('')}
        <div class="tot-grand"><span>${DUE}</span><b>${c.money(c.invoice.grandTotal)}</b></div>
      </div>
      ${inWords(c)}
    </div>`,
};
