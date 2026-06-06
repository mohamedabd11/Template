/**
 * GalleryPage — Marketplace-style template gallery: search, category filter, favorites,
 * full preview, select, copy, customize.
 */
import { h, clear } from '../utils/dom.js';
import { TemplateService } from '../services/TemplateService.js';
import { FavoritesRepository } from '../storage/FavoritesRepository.js';
import { TemplateEngine } from '../templates/engine/TemplateEngine.js';
import { TEMPLATE_CATEGORIES } from '../core/config.js';
import { getSampleInvoice } from '../utils/sample.js';
import { store } from '../core/store.js';
import { TemplateCard } from '../components/TemplateCard.js';
import { Modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';

export async function GalleryPage() {
  const el = h('div', { class: 'max-w-7xl mx-auto px-4 py-6' });

  const [meta, favIds, sample] = await Promise.all([
    TemplateService.listMeta(), FavoritesRepository.list(), getSampleInvoice(),
  ]);
  const favSet = new Set(favIds);

  let query = '';
  let category = 'All';
  let favOnly = false;

  // ---- Toolbar ----
  const searchInput = h('input', {
    type: 'search', placeholder: 'ابحث عن قالب… (الاسم، التصنيف، الوسم)',
    class: 'w-full sm:w-80 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200',
    oninput: (e) => { query = e.target.value.trim().toLowerCase(); render(); },
  });

  const chip = (label, value) => h('button', {
    class: 'cat-chip', dataset: { value },
    // Selecting a category also leaves favorites-only mode (they're independent filters).
    onClick: () => { category = value; favOnly = false; render(); },
  }, label);

  const chips = h('div', { class: 'flex flex-wrap gap-2' },
    chip('الكل', 'All'),
    ...TEMPLATE_CATEGORIES.map((c) => chip(c, c)),
    h('button', { class: 'cat-chip', dataset: { value: '__fav' }, onClick: () => { favOnly = !favOnly; render(); } }, '★ المفضلة'),
  );

  const grid = h('div', { class: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-5' });
  const countEl = h('div', { class: 'text-sm text-slate-400 mt-4' });

  el.appendChild(h('div', { class: 'flex flex-col gap-4' },
    h('div', {},
      h('h1', { class: 'text-2xl font-extrabold text-slate-800' }, 'معرض القوالب'),
      h('p', { class: 'text-slate-500 text-sm' }, 'اختر قالباً احترافياً لإعادة تصميم فاتورتك — معاينة حية، تخصيص، ونسخ.'),
    ),
    h('div', { class: 'flex flex-col sm:flex-row sm:items-center gap-3 justify-between' }, searchInput, chips),
    countEl,
  ));
  el.appendChild(grid);

  // ---- Handlers ----
  const handlers = {
    onToggleFav: async (m, btn) => {
      const now = await FavoritesRepository.toggle(m.id);
      btn.textContent = now ? '★' : '☆'; btn.classList.toggle('is-fav', now);
      if (now) favSet.add(m.id); else favSet.delete(m.id);
    },
    onPreview: async (m) => {
      const tpl = await TemplateService.get(m.id);
      const page = TemplateEngine.render(sample, tpl);
      const scaler = h('div', { class: 'preview-scale' }, page);
      Modal({
        title: `معاينة: ${m.name}`, size: 'full', body: scaler,
        actions: [
          h('button', { class: 'btn-primary', onClick: () => { selectTemplate(m); document.querySelector('.fixed.inset-0')?.remove(); } }, 'اختيار هذا القالب'),
        ],
      });
    },
    onSelect: (m) => selectTemplate(m),
    onCopy: async (m) => { const c = await TemplateService.duplicate(m.id); toast(`تم إنشاء نسخة: ${c.name}`, 'success'); refreshMeta(); },
    onCustomize: (m) => { location.hash = `#/designer/${m.id}`; },
  };

  function selectTemplate(m) {
    store.set('selectedTemplateId', m.id);
    toast(`تم اختيار: ${m.name}`, 'success');
    location.hash = '#/preview';
  }

  let currentMeta = meta;
  async function refreshMeta() { currentMeta = await TemplateService.listMeta(); render(); }

  function render() {
    chips.querySelectorAll('.cat-chip').forEach((b) => {
      const active = (b.dataset.value === category) || (b.dataset.value === '__fav' && favOnly);
      b.classList.toggle('is-active', active);
    });

    const list = currentMeta.filter((m) => {
      if (favOnly && !favSet.has(m.id)) return false;
      if (category !== 'All' && m.category !== category) return false;
      if (query) {
        const hay = `${m.name} ${m.nameEn} ${m.category} ${(m.tags || []).join(' ')}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });

    clear(grid);
    if (!list.length) { grid.appendChild(h('div', { class: 'col-span-full text-center text-slate-400 py-12' }, 'لا توجد قوالب مطابقة')); }
    list.forEach((m) => grid.appendChild(TemplateCard(m, { sampleInvoice: sample, isFavorite: favSet.has(m.id), handlers })));
    countEl.textContent = `${list.length} قالب`;
  }

  render();
  return { el };
}
