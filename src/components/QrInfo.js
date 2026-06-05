/**
 * QrInfo — decodes a QR payload and shows what's inside, in human-readable form.
 * For ZATCA invoices the payload is TLV/Base64 (NOT a link): seller, VAT number, timestamp,
 * total, VAT total, plus Phase-2 cryptographic fields. For anything else (URL/plain text)
 * it shows the raw content with a note.
 */
import { h } from '../utils/dom.js';
import { money } from '../utils/format.js';
import { date } from '../utils/format.js';
import { decodeZatcaTLV } from '../utils/qrUtils.js';

function row(arLabel, enLabel, value) {
  if (value == null || value === '') return null;
  return h('div', { class: 'flex justify-between gap-3 py-2 border-b border-slate-100 last:border-0' },
    h('div', { class: 'text-xs text-slate-500 shrink-0' }, h('div', {}, arLabel), h('div', { class: 'text-[10px] opacity-70' }, enLabel)),
    h('div', { class: 'text-sm font-semibold text-slate-800 text-left break-all' }, value),
  );
}

export function QrInfo(content) {
  if (!content) {
    return h('div', { class: 'text-sm text-slate-500' }, 'لا يوجد محتوى QR لهذه الفاتورة.');
  }

  const tlv = decodeZatcaTLV(content);
  // Treat as ZATCA only with a plausible VAT number (10-15 digits) or a numeric total,
  // so random/garbage Base64 isn't mislabeled as a valid invoice.
  const plausibleVat = /^\d{10,15}$/.test((tlv?.vatNumber || '').trim());
  const numericTotal = tlv?.total != null && tlv.total !== '' && !isNaN(Number(tlv.total));
  const isZatca = tlv && (plausibleVat || numericTotal);

  if (isZatca) {
    const hasHash = tlv.raw?.[6] != null;
    const hasSig = tlv.raw?.[7] != null;
    const phase2 = hasHash || hasSig;
    return h('div', {},
      h('div', { class: 'flex items-center gap-2 mb-3' },
        h('span', { class: 'text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1' }, '✓ فاتورة زاتكا صالحة (ZATCA)'),
        phase2 ? h('span', { class: 'text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-2.5 py-1' }, 'المرحلة الثانية') : null,
      ),
      h('div', { class: 'rounded-xl border border-slate-200 divide-y divide-slate-100 px-3' },
        row('اسم البائع', 'Seller name', tlv.seller),
        row('الرقم الضريبي', 'VAT number', tlv.vatNumber),
        row('تاريخ ووقت الفاتورة', 'Timestamp', formatTs(tlv.timestamp)),
        row('الإجمالي شامل الضريبة', 'Total (incl. VAT)', fmtAmount(tlv.total)),
        row('ضريبة القيمة المضافة', 'VAT total', fmtAmount(tlv.vatTotal)),
      ),
      phase2 ? h('div', { class: 'mt-3 text-xs text-slate-500 space-y-1' },
        hasHash ? h('div', {}, '🔒 بصمة الفاتورة (hash) موجودة') : null,
        hasSig ? h('div', {}, '🔏 التوقيع الرقمي موجود — يمكن التحقق من أصالة الفاتورة') : null,
      ) : null,
      h('div', { class: 'mt-3 text-[11px] text-slate-400 leading-relaxed' },
        'ملاحظة: رمز زاتكا لا يحتوي رابطاً — بل بيانات الفاتورة نفسها. للتحقق الرسمي استخدم تطبيق «فاتورة» من هيئة الزكاة والضريبة والجمارك.'),
      rawDetails(content),
    );
  }

  // Non-ZATCA: URL or plain text.
  const isUrl = /^https?:\/\//i.test(content.trim());
  return h('div', {},
    h('div', { class: 'text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 inline-block mb-3' },
      isUrl ? 'رابط (ليس فاتورة زاتكا)' : 'محتوى نصّي (ليس فاتورة زاتكا)'),
    isUrl
      ? h('a', { href: content, target: '_blank', rel: 'noopener', class: 'text-sm text-indigo-600 underline break-all' }, content)
      : h('div', { class: 'text-sm text-slate-700 break-all bg-slate-50 rounded-lg p-3 font-mono' }, content),
    h('div', { class: 'mt-2 text-[11px] text-slate-400' },
      'هذا المحتوى ليس بصيغة TLV الخاصة بزاتكا. إن كانت فاتورة تجريبية فهذا متوقّع.'),
  );
}

function fmtAmount(v) {
  if (v == null || v === '') return '';
  const n = Number(v);
  return isNaN(n) ? String(v) : money(n);
}
function formatTs(ts) {
  if (!ts) return '';
  const d = date(ts);
  return d || ts;
}
function rawDetails(content) {
  return h('details', { class: 'mt-3 text-xs text-slate-400' },
    h('summary', { class: 'cursor-pointer' }, 'المحتوى الخام (Base64)'),
    h('div', { class: 'mt-1 bg-slate-50 rounded-lg p-2 font-mono break-all max-h-32 overflow-auto text-[10px]' }, content),
  );
}
