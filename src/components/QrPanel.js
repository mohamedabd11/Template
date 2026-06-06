/**
 * QrPanel — the 4 QR options. Updates the store's qr fields.
 * Policy: extracted QR content is preserved; regenerate only on explicit click.
 */
import { h } from '../utils/dom.js';
import { QrService } from '../services/QrService.js';
import { store } from '../core/store.js';
import { toast } from './Toast.js';

export function QrPanel(opts = {}) {
  const getPdf = () => (typeof opts.getPdfFile === 'function' ? opts.getPdfFile() : opts.pdfFile) || null;
  const status = h('div', { class: 'text-xs text-slate-500' });
  const preview = h('div', { class: 'mt-3 grid place-items-center' });
  const contentBox = h('textarea', { class: 'w-full border border-slate-200 rounded-lg p-2 text-xs font-mono mt-2', rows: 3, placeholder: 'محتوى رمز QR (يُحفظ كما هو من الفاتورة الأصلية)' });

  const apply = (r) => {
    if (r.imageDataUrl) { store.set('qrImageDataUrl', r.imageDataUrl); preview.innerHTML = ''; preview.appendChild(h('img', { src: r.imageDataUrl, class: 'w-28 h-28 object-contain border rounded-lg p-1' })); }
    if (r.content) { store.set('qrContent', r.content); contentBox.value = r.content; }
    if (r.decoded?.total) status.textContent = `تم التعرف على رمز ZATCA — البائع: ${r.decoded.seller || '—'}، الإجمالي: ${r.decoded.total}`;
    else status.textContent = 'تم تحديث رمز QR.';
  };

  const run = async (fn) => { try { status.textContent = 'جارٍ المعالجة…'; apply(await fn()); toast('تم تحديث رمز QR', 'success'); } catch (e) { status.textContent = ''; toast(e.message || 'فشل', 'error'); } };

  const fileInput = (accept, cb) => { const i = h('input', { type: 'file', accept, class: 'hidden', onChange: (e) => e.target.files[0] && cb(e.target.files[0]) }); return i; };
  const upInput = fileInput('image/*', (f) => run(() => QrService.uploadImage(f)));
  const readInput = fileInput('image/*', (f) => run(() => QrService.readFromImage(f)));

  const btn = (label, fn, cls = 'bg-slate-100 text-slate-700') => h('button', { class: `text-sm font-semibold px-3 py-2 rounded-lg ${cls}`, onClick: fn }, label);

  return h('div', { class: 'bg-white rounded-xl border border-slate-200 p-4' },
    h('h4', { class: 'font-bold text-slate-700 mb-1 text-sm' }, 'إدارة رمز QR'),
    h('p', { class: 'text-xs text-slate-400 mb-3' }, 'يتم الاحتفاظ بمحتوى الرمز الأصلي. لا يُنشأ رمز جديد إلا عند الطلب.'),
    h('div', { class: 'flex flex-wrap gap-2' },
      btn('① رفع صورة QR', () => upInput.click()),
      btn('② قراءة QR من صورة', () => readInput.click()),
      btn('③ قراءة QR من PDF', () => { const f = getPdf(); return f ? run(() => QrService.readFromPdf(f)) : toast('ارفع ملف PDF أولاً من تبويب الاستيراد', 'warn'); }),
      btn('④ إعادة رسم QR من المحتوى', () => contentBox.value.trim() ? run(() => QrService.regenerate(contentBox.value.trim())) : toast('أدخل المحتوى أولاً', 'warn'), 'bg-indigo-600 text-white'),
    ),
    upInput, readInput,
    contentBox,
    preview,
    h('div', { class: 'mt-2' }, status),
  );
}
