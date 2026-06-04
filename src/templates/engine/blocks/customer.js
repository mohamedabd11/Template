/**
 * Customer block variants — different ways/places to present the buyer (bill-to) data.
 */
import { esc } from '../../../utils/dom.js';

function rows(c) {
  const cu = c.invoice.customer;
  return [
    cu.vatNumber && ['الرقم الضريبي', cu.vatNumber],
    cu.address && ['العنوان', cu.address],
    cu.phone && ['الهاتف', cu.phone],
    cu.email && ['البريد', cu.email],
  ].filter(Boolean);
}

export const customerBlocks = {
  // Bordered card on the right.
  card: (c) => `
    <div class="cust cust--card">
      <div class="cust-label">فاتورة إلى</div>
      <div class="cust-name">${esc(c.invoice.customer.name || 'اسم العميل')}</div>
      ${rows(c).map(([k, v]) => `<div class="cust-line"><span>${k}:</span> ${esc(v)}</div>`).join('')}
    </div>`,

  // Two columns: bill-to vs invoice meta side by side.
  'two-col': (c) => `
    <div class="cust cust--twocol">
      <div class="cust-col">
        <div class="cust-label">العميل</div>
        <div class="cust-name">${esc(c.invoice.customer.name || 'اسم العميل')}</div>
        ${rows(c).map(([k, v]) => `<div class="cust-line"><span>${k}:</span> ${esc(v)}</div>`).join('')}
      </div>
      <div class="cust-col cust-col--meta">
        <div class="cust-label">بيانات الفاتورة</div>
        <div class="cust-line"><span>رقم:</span> ${esc(c.invoice.invoiceNumber)}</div>
        <div class="cust-line"><span>تاريخ:</span> ${esc(c.date(c.invoice.date))}</div>
        ${c.invoice.dueDate ? `<div class="cust-line"><span>استحقاق:</span> ${esc(c.date(c.invoice.dueDate))}</div>` : ''}
      </div>
    </div>`,

  // Single horizontal strip.
  'inline-strip': (c) => `
    <div class="cust cust--strip">
      <span class="cust-label">العميل:</span>
      <span class="cust-name">${esc(c.invoice.customer.name || 'اسم العميل')}</span>
      ${rows(c).map(([k, v]) => `<span class="cust-chip">${k}: ${esc(v)}</span>`).join('')}
    </div>`,

  // Heavy boxed block with shaded label header.
  boxed: (c) => `
    <div class="cust cust--boxed">
      <div class="cust-box-head">بيانات العميل</div>
      <div class="cust-box-body">
        <div class="cust-name">${esc(c.invoice.customer.name || 'اسم العميل')}</div>
        ${rows(c).map(([k, v]) => `<div class="cust-line"><span>${k}:</span> ${esc(v)}</div>`).join('')}
      </div>
    </div>`,

  // Definition list with aligned labels.
  'labeled-rows': (c) => `
    <div class="cust cust--labeled">
      <dl>
        <div><dt>العميل</dt><dd>${esc(c.invoice.customer.name || 'اسم العميل')}</dd></div>
        ${rows(c).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}
      </dl>
    </div>`,
};
