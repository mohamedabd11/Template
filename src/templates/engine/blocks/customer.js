/**
 * Customer block variants — different ways/places to present the buyer (bill-to) data.
 */
import { esc } from '../../../utils/dom.js';
import { bl, blText } from '../labels.js';

function rows(c) {
  const cu = c.invoice.customer;
  return [
    cu.vatNumber && [bl('vatNo'), cu.vatNumber],
    cu.address && [bl('address'), cu.address],
    cu.phone && [bl('phone'), cu.phone],
    cu.email && [bl('email'), cu.email],
  ].filter(Boolean);
}

export const customerBlocks = {
  // Bordered card on the right.
  card: (c) => `
    <div class="cust cust--card">
      <div class="cust-label">${bl('billTo')}</div>
      <div class="cust-name">${esc(c.invoice.customer.name || 'اسم العميل')}</div>
      ${rows(c).map(([k, v]) => `<div class="cust-line"><span>${k}:</span> ${esc(v)}</div>`).join('')}
    </div>`,

  // Two columns: bill-to vs invoice meta side by side.
  'two-col': (c) => `
    <div class="cust cust--twocol">
      <div class="cust-col">
        <div class="cust-label">${bl('billTo')}</div>
        <div class="cust-name">${esc(c.invoice.customer.name || 'اسم العميل')}</div>
        ${rows(c).map(([k, v]) => `<div class="cust-line"><span>${k}:</span> ${esc(v)}</div>`).join('')}
      </div>
      <div class="cust-col cust-col--meta">
        <div class="cust-label">${bl('invoiceDetails')}</div>
        <div class="cust-line"><span>${bl('invoiceNo')}:</span> ${esc(c.invoice.invoiceNumber)}</div>
        <div class="cust-line"><span>${bl('date')}:</span> ${esc(c.date(c.invoice.date))}</div>
        ${c.invoice.dueDate ? `<div class="cust-line"><span>${bl('dueDate')}:</span> ${esc(c.date(c.invoice.dueDate))}</div>` : ''}
      </div>
    </div>`,

  // Single horizontal strip.
  'inline-strip': (c) => `
    <div class="cust cust--strip">
      <span class="cust-label">${blText('billTo')}:</span>
      <span class="cust-name">${esc(c.invoice.customer.name || 'اسم العميل')}</span>
      ${rows(c).map(([k, v]) => `<span class="cust-chip">${k}: ${esc(v)}</span>`).join('')}
    </div>`,

  // Heavy boxed block with shaded label header.
  boxed: (c) => `
    <div class="cust cust--boxed">
      <div class="cust-box-head">${bl('customerData')}</div>
      <div class="cust-box-body">
        <div class="cust-name">${esc(c.invoice.customer.name || 'اسم العميل')}</div>
        ${rows(c).map(([k, v]) => `<div class="cust-line"><span>${k}:</span> ${esc(v)}</div>`).join('')}
      </div>
    </div>`,

  // Definition list with aligned labels.
  'labeled-rows': (c) => `
    <div class="cust cust--labeled">
      <dl>
        <div><dt>${bl('customer')}</dt><dd>${esc(c.invoice.customer.name || 'اسم العميل')}</dd></div>
        ${rows(c).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}
      </dl>
    </div>`,
};
