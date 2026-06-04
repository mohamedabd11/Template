/**
 * ReviewPanel — shows fields extracted from PDF/OCR for the user to confirm or correct.
 * Fields that the parser could NOT find are flagged so the user fills them in manually.
 */
import { h } from '../utils/dom.js';

export function ReviewPanel(result) {
  const p = result.payload || {};
  const found = new Set(result.found || []);

  const row = (label, name, value, key) => {
    const missing = !found.has(key) && !value;
    return h('label', { class: 'block' },
      h('span', { class: 'flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1' },
        label,
        missing ? h('span', { class: 'text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded' }, 'لم يُستخرج — أدخله يدوياً')
          : h('span', { class: 'text-[10px] bg-emerald-100 text-emerald-700 px-1.5 rounded' }, 'مستخرج'),
      ),
      h('input', {
        name, value: value || '',
        class: `w-full border rounded-lg px-3 py-2 text-sm outline-none ${missing ? 'border-amber-300 bg-amber-50' : 'border-slate-200'}`,
      }),
    );
  };

  const t = p.originalTotals || {};
  const el = h('div', { class: 'space-y-3' },
    h('div', { class: 'text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2.5' },
      'تمت محاولة استخراج البيانات من المصدر. راجع القيم وعدّل ما يلزم — لن يتم تغيير أرقام الفاتورة الأصلية.'),
    h('div', { class: 'grid grid-cols-1 sm:grid-cols-2 gap-3' },
      row('رقم الفاتورة', 'invoiceNumber', p.invoiceNumber, 'invoiceNumber'),
      row('التاريخ', 'date', p.date, 'date'),
      row('اسم العميل', 'customer.name', p.customer?.name, 'customer'),
      row('الرقم الضريبي للعميل', 'customer.vatNumber', p.customer?.vatNumber, 'vatNumber'),
      row('الإجمالي قبل الضريبة', 'subtotal', t.subtotal ?? '', 'subtotal'),
      row('قيمة الضريبة', 'tax', t.tax ?? '', 'tax'),
      row('الإجمالي المستحق', 'total', t.total ?? '', 'total'),
    ),
    result.rawText ? h('details', { class: 'text-xs text-slate-400' },
      h('summary', { class: 'cursor-pointer' }, 'النص المستخرج (للمراجعة)'),
      h('pre', { class: 'whitespace-pre-wrap bg-slate-50 p-2 rounded mt-1 max-h-40 overflow-auto' }, result.rawText.slice(0, 2000)),
    ) : null,
  );

  el.read = () => {
    const v = (n) => el.querySelector(`[name="${n}"]`)?.value.trim() || '';
    const num = (n) => { const x = parseFloat(v(n)); return isNaN(x) ? null : x; };
    const totals = { subtotal: num('subtotal'), tax: num('tax'), total: num('total'), discount: null };
    const hasTotals = totals.subtotal != null || totals.tax != null || totals.total != null;
    return {
      invoiceNumber: v('invoiceNumber'), date: v('date'),
      customer: { name: v('customer.name'), vatNumber: v('customer.vatNumber') },
      originalTotals: hasTotals ? totals : null,
      // Items aren't reliably parseable from scans — start with one editable placeholder line
      // reflecting the total so the document still renders; user can refine in the form.
      items: hasTotals && totals.total != null
        ? [{ description: 'إجمالي الفاتورة (مستورد)', qty: 1, unitPrice: (totals.subtotal ?? totals.total), taxRate: 0.15, discount: 0 }]
        : [],
    };
  };

  return el;
}
