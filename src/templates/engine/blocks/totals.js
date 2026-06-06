/**
 * Totals block variants — different ways to present the summary/grand total.
 * Reflects the invoice's figures. Value elements carry data-total / data-total-words so the
 * preview can live-recalculate them in place when items are edited (without re-rendering).
 */
import { esc } from '../../../utils/dom.js';
import { bl, blText, T } from '../labels.js';

// Money <b> with recalc hooks. key drives live updates; data-money picks symbol vs plain.
function mny(c, val, key, { sym = true, neg = false, tag = 'b', cls = '' } = {}) {
  const text = (neg ? '- ' : '') + (sym ? c.money(val) : c.money(val, false));
  const attrs = `data-total="${key}" data-money="${sym ? 'sym' : 'plain'}"${neg ? ' data-neg="1"' : ''}`;
  return `<${tag} class="${cls}" ${attrs}>${text}</${tag}>`;
}

function lines(c) {
  const inv = c.invoice;
  return [
    [bl('subtotal'), inv.subtotal, 'net', false],
    inv.discountTotal ? [bl('discount'), inv.discountTotal, 'discount', true] : null,
    [bl('vat15'), inv.taxTotal, 'tax', false],
  ].filter(Boolean);
}

function inWords(c) {
  return `<div class="tot-words"><span>${blText('amountInWords')}:</span> <span data-total-words="ar">${esc(c.tafqeet(c.invoice.grandTotal))}</span></div>`;
}

const DUE = bl('totalDue');

export const totalsBlocks = {
  // Boxed block aligned to the right with a highlighted grand-total row.
  'boxed-right': (c) => `
    <div class="tot tot--boxed">
      ${lines(c).map(([k, v, key, neg]) => `<div class="tot-line"><span>${k}</span>${mny(c, v, key, { neg })}</div>`).join('')}
      <div class="tot-grand"><span>${DUE}</span>${mny(c, c.invoice.grandTotal, 'grand')}</div>
      ${inWords(c)}
    </div>`,

  // Card with grand total as a big number at the top.
  'stacked-card': (c) => `
    <div class="tot tot--card">
      <div class="tot-card-grand">
        <div class="tot-card-label">${DUE}</div>
        <div class="tot-card-value">${mny(c, c.invoice.grandTotal, 'grand', { tag: 'span' })}</div>
      </div>
      <div class="tot-card-lines">
        ${lines(c).map(([k, v, key, neg]) => `<div class="tot-line"><span>${k}</span>${mny(c, v, key, { neg })}</div>`).join('')}
      </div>
      ${inWords(c)}
    </div>`,

  // Full-width accent bar emphasizing the total.
  'highlight-bar': (c) => `
    <div class="tot tot--bar">
      <div class="tot-bar-lines">
        ${lines(c).map(([k, v, key, neg]) => `<div class="tot-line"><span>${k}</span>${mny(c, v, key, { neg })}</div>`).join('')}
      </div>
      <div class="tot-bar-grand"><span>${DUE}</span>${mny(c, c.invoice.grandTotal, 'grand')}</div>
      ${inWords(c)}
    </div>`,

  // Accounting ledger look (ruled lines, double underline on total).
  ledger: (c) => `
    <div class="tot tot--ledger">
      <table>
        ${lines(c).map(([k, v, key, neg]) => `<tr><td>${k}</td><td class="tot-num">${mny(c, v, key, { neg, tag: 'span' })}</td></tr>`).join('')}
        <tr class="tot-ledger-grand"><td>${DUE}</td><td class="tot-num">${mny(c, c.invoice.grandTotal, 'grand', { tag: 'span' })}</td></tr>
      </table>
      ${inWords(c)}
    </div>`,

  // ZATCA statement: stacked bilingual bordered rows (Total / Discount / Taxable / VAT /
  // Gross / Balance Due) with the amount in words (English + Arabic).
  statement: (c) => {
    const inv = c.invoice;
    // inv.subtotal is already net (after discount). "Total Amount" = gross (before discount).
    const gross = inv.subtotal + inv.discountTotal;
    const rows = [
      [T.totalAmount, gross, 'gross'],
      [T.totalDiscount, inv.discountTotal, 'discount'],
      [T.taxableAmount, inv.subtotal, 'taxable'],
      [T.vatTotalAmount, inv.taxTotal, 'tax'],
      [T.grossTotal, inv.grandTotal, 'grand', 'is-gross'],
      [T.balanceDue, inv.grandTotal, 'grand', 'is-balance'],
    ];
    return `
      <div class="tot tot--statement">
        ${rows.map(([lbl, val, key, cls]) => `<div class="st-row ${cls || ''}">
          <span class="st-en">${lbl[1]} (SAR)</span>
          <span class="st-val" data-total="${key}" data-money="plain">${c.money(val, false)}</span>
          <span class="st-ar">${lbl[0]} (ر.س)</span></div>`).join('')}
        <div class="st-words"><span>Amount in words:</span> <span data-total-words="en">${esc(c.tafqeetEn(inv.grandTotal))}</span></div>
        <div class="st-words st-words--ar"><span>${T.amountInWords[0]}:</span> <span data-total-words="ar">${esc(c.tafqeet(inv.grandTotal))}</span></div>
      </div>`;
  },

  // Gold-framed luxury totals.
  'gold-frame': (c) => `
    <div class="tot tot--gold">
      <div class="tot-gold-inner">
        ${lines(c).map(([k, v, key, neg]) => `<div class="tot-line"><span>${k}</span>${mny(c, v, key, { neg })}</div>`).join('')}
        <div class="tot-grand"><span>${DUE}</span>${mny(c, c.invoice.grandTotal, 'grand')}</div>
      </div>
      ${inWords(c)}
    </div>`,
};
