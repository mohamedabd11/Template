/**
 * TemplateCard — gallery card showing a LIVE scaled mini-preview (no PNG), with
 * favorite, preview, select, copy and customize actions.
 */
import { h } from '../utils/dom.js';
import { TemplateService } from '../services/TemplateService.js';
import { TemplateEngine } from '../templates/engine/TemplateEngine.js';

export function TemplateCard(meta, { sampleInvoice, isFavorite, handlers = {} } = {}) {
  const previewBox = h('div', { class: 'tpl-card-preview' },
    h('div', { class: 'text-slate-300 text-xs grid place-items-center h-full' }, '…'));

  // Async-render the live mini preview.
  (async () => {
    try {
      const tpl = await TemplateService.get(meta.id);
      const node = TemplateEngine.renderPreview(sampleInvoice, tpl, 0.30);
      previewBox.innerHTML = '';
      previewBox.appendChild(node);
    } catch (e) {
      previewBox.innerHTML = '<div class="text-rose-400 text-xs grid place-items-center h-full">تعذر العرض</div>';
    }
  })();

  const favBtn = h('button', {
    class: `tpl-fav ${isFavorite ? 'is-fav' : ''}`,
    title: 'المفضلة',
    onClick: (e) => { e.stopPropagation(); handlers.onToggleFav?.(meta, favBtn); },
  }, isFavorite ? '★' : '☆');

  const actionBtn = (label, cls, fn) => h('button', {
    class: `tpl-act ${cls}`, onClick: (e) => { e.stopPropagation(); fn?.(meta); },
  }, label);

  return h('div', { class: 'tpl-card group' },
    h('div', { class: 'tpl-card-media' },
      previewBox,
      favBtn,
      h('div', { class: 'tpl-card-overlay' },
        actionBtn('معاينة', 'bg-white text-slate-800', handlers.onPreview),
        actionBtn('اختيار', 'bg-indigo-600 text-white', handlers.onSelect),
      ),
    ),
    h('div', { class: 'p-3' },
      h('div', { class: 'flex items-center justify-between gap-2' },
        h('div', { class: 'font-bold text-slate-800 text-sm truncate' }, meta.name),
        meta.builtin ? null : h('span', { class: 'text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded' }, 'مخصص'),
      ),
      h('div', { class: 'text-[11px] text-slate-400 mb-2' }, meta.category),
      h('div', { class: 'flex gap-1.5' },
        actionBtn('نسخ', 'flex-1 bg-slate-100 text-slate-700', handlers.onCopy),
        actionBtn('تخصيص', 'flex-1 bg-slate-100 text-slate-700', handlers.onCustomize),
      ),
    ),
  );
}
