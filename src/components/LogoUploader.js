/**
 * LogoUploader — lets the user attach/replace/remove the organization logo (as a data URL).
 * Reusable across the manual form and the preview page. The logo is stored on the invoice's
 * company (`company.logoDataUrl`) and rendered by the template engine; templates without a
 * logo fall back to a monogram of the company name.
 *
 * Returns an element with `.getLogo()` and fires `onChange(dataUrl|'')` on every change.
 */
import { h } from '../utils/dom.js';

export function LogoUploader({ initial = '', onChange, compact = false } = {}) {
  let dataUrl = initial || '';

  const img = h('img', {
    class: 'h-14 w-auto max-w-[170px] object-contain rounded-lg border border-slate-200 bg-white p-1',
    src: dataUrl || 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
    style: { display: dataUrl ? 'block' : 'none' },
  });
  const empty = h('div', {
    class: 'w-14 h-14 grid place-items-center rounded-lg border border-dashed border-slate-300 text-slate-300 text-2xl',
    style: { display: dataUrl ? 'none' : 'grid' },
  }, '🏢');

  const removeBtn = h('button', {
    type: 'button', class: 'text-sm text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-lg',
    style: { display: dataUrl ? 'inline-block' : 'none' },
    onClick: () => set(''),
  }, 'إزالة');

  const file = h('input', {
    type: 'file', accept: 'image/png,image/jpeg,image/svg+xml,image/webp', class: 'hidden',
    onChange: (e) => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => set(r.result);
      r.readAsDataURL(f);
      e.target.value = '';
    },
  });

  function set(url) {
    dataUrl = url || '';
    img.src = dataUrl || img.src;
    img.style.display = dataUrl ? 'block' : 'none';
    empty.style.display = dataUrl ? 'none' : 'grid';
    removeBtn.style.display = dataUrl ? 'inline-block' : 'none';
    onChange?.(dataUrl);
  }

  const el = h('div', { class: `flex items-center gap-3 ${compact ? '' : 'mt-1'}` },
    img, empty,
    h('div', { class: 'flex flex-col items-start gap-1' },
      h('button', { type: 'button', class: 'btn-secondary !py-1.5', onClick: () => file.click() }, dataUrl ? 'تغيير الشعار' : 'رفع شعار'),
      compact ? null : h('span', { class: 'text-[11px] text-slate-400' }, 'PNG / JPG / SVG'),
    ),
    removeBtn, file,
  );

  el.getLogo = () => dataUrl;
  el.setLogo = set;
  return el;
}
