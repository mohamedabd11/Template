/**
 * Customer block variants — different ways/places to present the buyer (bill-to) data.
 */
import { esc } from '../../../utils/dom.js';
import { bl, blText, T } from '../labels.js';

/** A bilingual label+value cell used by the ZATCA details grids. */
function zCell(labelHtml, value, cls = '') {
  const v = (value == null || value === '') ? '—' : esc(value);
  return `<div class="zd-cell ${cls}"><span class="zd-lbl">${labelHtml}</span><span class="zd-val">${v}</span></div>`;
}

function detailsBlock(labelPair, p) {
  return `
    <div class="zd">
      <div class="zd-head"><span>${labelPair[1]}</span><span>${labelPair[0]}</span></div>
      <div class="zd-grid">
        ${zCell(bl('fldName'), p.name, 'zd-cell--wide')}
        ${zCell(bl('fldStreet'), p.street)}
        ${zCell(bl('fldCity'), p.city)}
        ${zCell(bl('fldBuilding'), p.buildingNumber)}
        ${zCell(bl('fldDistrict'), p.district)}
        ${zCell(bl('fldAddl'), p.additionalNumber)}
        ${zCell(bl('fldPostal'), p.postalCode)}
        ${zCell(bl('fldCountry'), p.country)}
        ${zCell(bl('vatNo'), p.vatNumber)}
        ${zCell(bl('crNo'), p.crNumber)}
      </div>
    </div>`;
}

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

  // ZATCA detailed: Seller Details grid + Buyer Details grid + dates/reference row.
  'zatca-details': (c) => {
    const inv = c.invoice;
    return `
      ${detailsBlock(T.sellerDetails, c.invoice.company)}
      ${detailsBlock(T.buyerDetails, c.invoice.customer)}
      <div class="zd zd--dates"><div class="zd-grid zd-grid--dates">
        ${zCell(bl('date'), c.date(inv.date))}
        ${zCell(bl('supplyDate'), c.date(inv.supplyDate))}
        ${zCell(bl('contractPo'), inv.poNumber)}
        ${zCell(bl('dueDate'), c.date(inv.dueDate))}
        ${zCell(bl('invoicePeriod'), inv.invoicePeriod)}
        ${zCell(bl('projectRef'), inv.project)}
      </div></div>`;
  },

  // Definition list with aligned labels.
  'labeled-rows': (c) => `
    <div class="cust cust--labeled">
      <dl>
        <div><dt>${bl('customer')}</dt><dd>${esc(c.invoice.customer.name || 'اسم العميل')}</dd></div>
        ${rows(c).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}
      </dl>
    </div>`,
};
