/**
 * DesignerPage — customize a template: colors, fonts, logo, and block variants (element
 * placement) with live preview. Saves as a custom template (LocalStorage via repository).
 */
import { h, clear } from '../utils/dom.js';
import { TemplateService } from '../services/TemplateService.js';
import { TemplateEngine } from '../templates/engine/TemplateEngine.js';
import { Template } from '../models/Template.js';
import { getSampleInvoice } from '../utils/sample.js';
import { store } from '../core/store.js';
import { toast } from '../components/Toast.js';

const VARIANTS = {
  header: ['band', 'split', 'centered', 'stacked', 'sidebar', 'hero', 'darkbar', 'ribbon', 'blueprint', 'minimal-line'],
  customer: ['card', 'two-col', 'inline-strip', 'boxed', 'labeled-rows'],
  table: ['striped', 'grid', 'minimal-lines', 'dark-header', 'pill', 'blueprint', 'boarding-pass'],
  totals: ['boxed-right', 'stacked-card', 'highlight-bar', 'ledger', 'gold-frame'],
  qr: ['framed', 'plain', 'circle-badge', 'corner', 'captioned'],
  footer: ['bar', 'centered-note', 'signature-stamp', 'blueprint-strip', 'gradient'],
};
const VLABEL = { header: 'الترويسة', customer: 'بيانات العميل', table: 'الجدول', totals: 'الإجماليات', qr: 'رمز QR', footer: 'التذييل' };

export async function DesignerPage(params = {}) {
  const el = h('div', { class: 'max-w-7xl mx-auto px-4 py-6' });
  const base = await TemplateService.get(params.id || 'corporate-blue');
  const sample = await getSampleInvoice();

  // Work on a draft copy so the built-in template stays untouched.
  const draft = Template.fromJSON({ ...base.toJSON(), id: crypto.randomUUID(), builtin: false, basedOn: base.id, name: `${base.name} (مخصص)` });
  // Give the draft a unique scope so live CSS edits apply (re-scope css from base id).
  draft.css = (base.css || '').replaceAll(`tpl-${base.id}`, `tpl-${draft.id}`);

  const previewWrap = h('div', { class: 'preview-frame view-a4' });
  function rerender() { clear(previewWrap); previewWrap.appendChild(TemplateEngine.render(sample, draft)); }

  const colorInput = (label, key, def) => {
    const i = h('input', { type: 'color', value: draft.theme[key] || def, class: 'w-9 h-9 rounded border border-slate-200 cursor-pointer', oninput: (e) => { draft.theme[key] = e.target.value; rerender(); } });
    return h('label', { class: 'flex items-center justify-between gap-2 text-sm' }, h('span', { class: 'text-slate-600' }, label), i);
  };

  const fontSelect = (label, key) => {
    const fonts = ['Tajawal', 'Cairo', 'IBM Plex Sans Arabic', 'Almarai'];
    const s = h('select', { class: 'border border-slate-200 rounded-lg px-2 py-1.5 text-sm', onchange: (e) => { draft.fonts[key] = e.target.value; rerender(); } },
      ...fonts.map((f) => h('option', { value: f, selected: draft.fonts[key] === f }, f)));
    return h('label', { class: 'flex items-center justify-between gap-2 text-sm' }, h('span', { class: 'text-slate-600' }, label), s);
  };

  const variantSelect = (region) => {
    const s = h('select', { class: 'border border-slate-200 rounded-lg px-2 py-1.5 text-sm w-full', onchange: (e) => { draft.layout[region] = { variant: e.target.value }; rerender(); } },
      ...VARIANTS[region].map((v) => h('option', { value: v, selected: draft.layout[region]?.variant === v }, v)));
    return h('label', { class: 'block' }, h('span', { class: 'block text-xs font-semibold text-slate-500 mb-1' }, VLABEL[region]), s);
  };

  const logoInput = h('input', { type: 'file', accept: 'image/*', class: 'text-xs', onchange: (e) => {
    const f = e.target.files[0]; if (!f) return; const r = new FileReader();
    r.onload = () => { sample.company.logoDataUrl = r.result; rerender(); }; r.readAsDataURL(f);
  } });

  const section = (title, ...kids) => h('div', { class: 'bg-white rounded-xl border border-slate-200 p-4' }, h('h4', { class: 'font-bold text-slate-700 mb-3 text-sm' }, title), ...kids);

  const sidebar = h('div', { class: 'space-y-4' },
    h('div', {},
      h('input', { value: draft.name, class: 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold', oninput: (e) => draft.name = e.target.value }),
    ),
    section('الألوان',
      h('div', { class: 'space-y-2' },
        colorInput('اللون الأساسي', 'primary', '#1e3a8a'),
        colorInput('اللون المساعد', 'accent', '#3b82f6'),
        colorInput('لون النص', 'text', '#0f172a'),
        colorInput('لون الخطوط', 'line', '#e2e8f0'),
      ),
    ),
    section('الخطوط', h('div', { class: 'space-y-2' }, fontSelect('خط العناوين', 'heading'), fontSelect('الخط الأساسي', 'base'))),
    section('الشعار', logoInput),
    section('تخطيط العناصر', h('div', { class: 'space-y-2' }, ...Object.keys(VARIANTS).map(variantSelect))),
    h('div', { class: 'flex gap-2' },
      h('button', { class: 'btn-primary flex-1', onClick: async () => { await TemplateService.saveCustom(draft); store.set('selectedTemplateId', draft.id); toast('تم حفظ القالب المخصص', 'success'); location.hash = '#/gallery'; } }, 'حفظ القالب'),
      h('button', { class: 'btn-secondary', onClick: () => { store.set('selectedTemplateId', draft.id); TemplateService.saveCustom(draft).then(() => location.hash = '#/preview'); } }, 'معاينة'),
    ),
  );

  el.append(
    h('h1', { class: 'text-2xl font-extrabold text-slate-800 mb-1' }, 'مصمم القوالب'),
    h('p', { class: 'text-slate-500 text-sm mb-5' }, `تخصيص استناداً إلى: ${base.name}`),
    h('div', { class: 'grid lg:grid-cols-[320px_1fr] gap-6 items-start' },
      sidebar,
      h('div', { class: 'preview-stage' }, previewWrap),
    ),
  );

  rerender();
  return { el };
}
