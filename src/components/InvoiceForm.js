/**
 * InvoiceForm — manual invoice entry with dynamic line items.
 * `read()` returns a plain payload suitable for `new Invoice(payload)`.
 */
import { h } from '../utils/dom.js';

function field(label, name, value = '', opts = {}) {
  return h('label', { class: 'block' },
    h('span', { class: 'block text-xs font-semibold text-slate-500 mb-1' }, label),
    h('input', {
      name, value, type: opts.type || 'text', placeholder: opts.placeholder || '',
      class: 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none',
    }),
  );
}

function itemRow(item = {}) {
  const inp = (name, val, type = 'text', cls = '') => h('input', {
    name, value: val ?? '', type, dataset: { item: name },
    class: `border border-slate-200 rounded-lg px-2 py-1.5 text-sm w-full ${cls}`,
  });
  return h('div', { class: 'grid grid-cols-12 gap-1.5 items-center item-row' },
    h('div', { class: 'col-span-5' }, inp('description', item.description, 'text')),
    h('div', { class: 'col-span-2' }, inp('qty', item.qty ?? 1, 'number')),
    h('div', { class: 'col-span-2' }, inp('unitPrice', item.unitPrice ?? 0, 'number')),
    h('div', { class: 'col-span-2' }, inp('discount', item.discount ?? 0, 'number')),
    h('div', { class: 'col-span-1' }, h('button', { type: 'button', class: 'text-rose-500 hover:bg-rose-50 rounded-lg w-full py-1.5', onClick: (e) => e.target.closest('.item-row').remove() }, '✕')),
  );
}

export function InvoiceForm(initial = {}) {
  const co = initial.company || {};
  const cu = initial.customer || {};
  const itemsWrap = h('div', { class: 'space-y-1.5' },
    ...((initial.items?.length ? initial.items : [{}, {}]).map(itemRow)));

  const section = (title, ...children) => h('div', { class: 'bg-white rounded-xl border border-slate-200 p-4' },
    h('h4', { class: 'font-bold text-slate-700 mb-3 text-sm' }, title), ...children);

  const grid = (...kids) => h('div', { class: 'grid grid-cols-1 sm:grid-cols-2 gap-3' }, ...kids);

  const el = h('div', { class: 'space-y-4' },
    section('بيانات المنشأة (المُصدِّر)',
      grid(
        field('اسم المنشأة', 'company.name', co.name),
        field('الاسم بالإنجليزية', 'company.nameEn', co.nameEn),
        field('الرقم الضريبي', 'company.vatNumber', co.vatNumber),
        field('السجل التجاري', 'company.crNumber', co.crNumber),
        field('العنوان', 'company.address', co.address),
        field('الهاتف', 'company.phone', co.phone),
      ),
    ),
    section('بيانات العميل',
      grid(
        field('اسم العميل', 'customer.name', cu.name),
        field('الرقم الضريبي للعميل', 'customer.vatNumber', cu.vatNumber),
        field('العنوان', 'customer.address', cu.address),
        field('الهاتف', 'customer.phone', cu.phone),
      ),
    ),
    section('بيانات الفاتورة',
      grid(
        field('رقم الفاتورة', 'invoiceNumber', initial.invoiceNumber),
        field('التاريخ', 'date', initial.date, { type: 'date' }),
        field('تاريخ الاستحقاق', 'dueDate', initial.dueDate, { type: 'date' }),
        field('أمر الشراء', 'poNumber', initial.poNumber),
      ),
      h('div', { class: 'mt-3' }, field('ملاحظات', 'notes', initial.notes)),
    ),
    section('البنود',
      h('div', { class: 'grid grid-cols-12 gap-1.5 text-xs font-semibold text-slate-400 mb-2 px-1' },
        h('div', { class: 'col-span-5' }, 'البيان'),
        h('div', { class: 'col-span-2' }, 'الكمية'),
        h('div', { class: 'col-span-2' }, 'سعر الوحدة'),
        h('div', { class: 'col-span-2' }, 'الخصم'),
        h('div', { class: 'col-span-1' }, ''),
      ),
      itemsWrap,
      h('button', { type: 'button', class: 'mt-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg', onClick: () => itemsWrap.appendChild(itemRow()) }, '＋ إضافة بند'),
    ),
  );

  el.read = () => {
    const val = (name) => el.querySelector(`[name="${name}"]`)?.value.trim() || '';
    const items = Array.from(itemsWrap.querySelectorAll('.item-row')).map((row) => {
      const g = (n) => row.querySelector(`[data-item="${n}"]`)?.value || '';
      return { description: g('description'), qty: Number(g('qty')) || 0, unitPrice: Number(g('unitPrice')) || 0, discount: Number(g('discount')) || 0, taxRate: 0.15 };
    }).filter((i) => i.description || i.unitPrice);
    return {
      invoiceNumber: val('invoiceNumber'), date: val('date'), dueDate: val('dueDate'),
      poNumber: val('poNumber'), notes: val('notes'),
      company: { name: val('company.name'), nameEn: val('company.nameEn'), vatNumber: val('company.vatNumber'), crNumber: val('company.crNumber'), address: val('company.address'), phone: val('company.phone') },
      customer: { name: val('customer.name'), vatNumber: val('customer.vatNumber'), address: val('customer.address'), phone: val('customer.phone') },
      items,
    };
  };

  return el;
}
