/**
 * One-off generator: writes /src/templates/<id>/{template.json,template.css} and
 * /src/templates/templates.index.json from the design table below.
 * Kept in-repo so contributors can regenerate or add templates consistently.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TPL_DIR = resolve(ROOT, 'src/templates');

const cols = {
  full: [
    { key: 'index', label: '#', align: 'center', width: '6%' },
    { key: 'description', label: 'البيان', align: 'right', width: '40%' },
    { key: 'qty', label: 'الكمية', align: 'center', width: '12%' },
    { key: 'unitPrice', label: 'سعر الوحدة', align: 'center', width: '14%' },
    { key: 'taxAmount', label: 'الضريبة', align: 'center', width: '14%' },
    { key: 'total', label: 'الإجمالي', align: 'center', width: '14%' },
  ],
};

// id, name(ar), nameEn, category, theme, fonts, layout variants, css identity
const T = [
  // ---- Corporate ----
  { id: 'corporate-blue', name: 'كوربوريت أزرق', en: 'Corporate Blue', cat: 'Corporate',
    theme: { primary: '#1e3a8a', accent: '#2563eb', line: '#dbe3f0' },
    fonts: { base: 'Tajawal', heading: 'Cairo' },
    L: { header: 'band', customer: 'card', table: 'striped', totals: 'boxed-right', qr: 'framed', footer: 'bar' },
    tags: ['corporate', 'blue', 'formal', 'saudi'] },
  { id: 'corporate-green', name: 'كوربوريت أخضر', en: 'Corporate Green', cat: 'Corporate',
    theme: { primary: '#065f46', accent: '#10b981', line: '#d3e7df' },
    fonts: { base: 'Tajawal', heading: 'Cairo' },
    L: { header: 'split', customer: 'two-col', table: 'grid', totals: 'ledger', qr: 'plain', footer: 'centered-note' },
    tags: ['corporate', 'green', 'ledger'] },
  { id: 'corporate-gray', name: 'كوربوريت رمادي', en: 'Corporate Gray', cat: 'Corporate',
    theme: { primary: '#374151', accent: '#6b7280', line: '#e5e7eb' },
    fonts: { base: 'IBM Plex Sans Arabic', heading: 'IBM Plex Sans Arabic' },
    L: { header: 'stacked', customer: 'labeled-rows', table: 'minimal-lines', totals: 'stacked-card', qr: 'corner', footer: 'signature-stamp' },
    tags: ['corporate', 'gray', 'restrained'] },

  // ---- Modern ----
  { id: 'modern-clean', name: 'مودرن نظيف', en: 'Modern Clean', cat: 'Modern',
    theme: { primary: '#0ea5e9', accent: '#38bdf8', line: '#e6f1f8' },
    fonts: { base: 'Tajawal', heading: 'Tajawal' },
    L: { header: 'centered', customer: 'inline-strip', table: 'minimal-lines', totals: 'highlight-bar', qr: 'captioned', footer: 'centered-note' },
    tags: ['modern', 'clean', 'airy'] },
  { id: 'modern-glass', name: 'مودرن زجاجي', en: 'Modern Glass', cat: 'Modern',
    theme: { primary: '#6366f1', accent: '#a855f7', line: '#e7e7fb' },
    fonts: { base: 'Tajawal', heading: 'Cairo' },
    L: { header: 'hero', customer: 'card', table: 'pill', totals: 'stacked-card', qr: 'circle-badge', footer: 'gradient' },
    tags: ['modern', 'glass', 'gradient'] },
  { id: 'modern-minimal', name: 'مودرن مينيمال', en: 'Modern Minimal', cat: 'Modern',
    theme: { primary: '#111827', accent: '#111827', line: '#ececec' },
    fonts: { base: 'IBM Plex Sans Arabic', heading: 'IBM Plex Sans Arabic' },
    L: { header: 'minimal-line', customer: 'inline-strip', table: 'minimal-lines', totals: 'stacked-card', qr: 'plain', footer: 'centered-note' },
    tags: ['modern', 'minimal', 'mono'] },

  // ---- Executive ----
  { id: 'executive-dark', name: 'إكزكتيف داكن', en: 'Executive Dark', cat: 'Executive',
    theme: { primary: '#0f172a', accent: '#3b82f6', text: '#0f172a', line: '#dde3ec' },
    fonts: { base: 'Tajawal', heading: 'Cairo' },
    L: { header: 'darkbar', customer: 'boxed', table: 'dark-header', totals: 'highlight-bar', qr: 'framed', footer: 'bar' },
    tags: ['executive', 'dark', 'contrast'] },
  { id: 'executive-gold', name: 'إكزكتيف ذهبي', en: 'Executive Gold', cat: 'Executive',
    theme: { primary: '#1a1a1a', accent: '#c9a227', line: '#ece3c8' },
    fonts: { base: 'Tajawal', heading: 'Cairo' },
    L: { header: 'ribbon', customer: 'card', table: 'grid', totals: 'gold-frame', qr: 'framed', footer: 'signature-stamp' },
    tags: ['executive', 'gold', 'luxury'] },
  { id: 'executive-premium', name: 'إكزكتيف بريميوم', en: 'Executive Premium', cat: 'Executive',
    theme: { primary: '#3b0764', accent: '#9333ea', line: '#e9ddf3' },
    fonts: { base: 'Tajawal', heading: 'Cairo' },
    L: { header: 'hero', customer: 'two-col', table: 'dark-header', totals: 'gold-frame', qr: 'circle-badge', footer: 'gradient' },
    tags: ['executive', 'premium', 'royal'] },

  // ---- Construction ----
  { id: 'construction-pro', name: 'إنشاءات برو', en: 'Construction Pro', cat: 'Construction',
    theme: { primary: '#9a3412', accent: '#f97316', line: '#f0ddd0' },
    fonts: { base: 'Cairo', heading: 'Cairo' },
    L: { header: 'band', customer: 'boxed', table: 'grid', totals: 'boxed-right', qr: 'framed', footer: 'bar' },
    tags: ['construction', 'orange', 'bold'] },
  { id: 'construction-site', name: 'إنشاءات موقع', en: 'Construction Site', cat: 'Construction',
    theme: { primary: '#a16207', accent: '#eab308', line: '#efe6c8' },
    fonts: { base: 'Cairo', heading: 'Cairo' },
    L: { header: 'sidebar', customer: 'labeled-rows', table: 'blueprint', totals: 'ledger', qr: 'corner', footer: 'blueprint-strip' },
    tags: ['construction', 'site', 'hi-vis'] },
  { id: 'construction-engineering', name: 'إنشاءات هندسي', en: 'Construction Engineering', cat: 'Construction',
    theme: { primary: '#1e40af', accent: '#0ea5e9', line: '#cfe0f5' },
    fonts: { base: 'IBM Plex Sans Arabic', heading: 'IBM Plex Sans Arabic' },
    L: { header: 'blueprint', customer: 'two-col', table: 'blueprint', totals: 'ledger', qr: 'plain', footer: 'blueprint-strip' },
    tags: ['construction', 'engineering', 'blueprint'] },

  // ---- Transport ----
  { id: 'transport-premium', name: 'نقل بريميوم', en: 'Transport Premium', cat: 'Transport',
    theme: { primary: '#1e3a8a', accent: '#06b6d4', line: '#d2e3f0' },
    fonts: { base: 'Tajawal', heading: 'Cairo' },
    L: { header: 'hero', customer: 'card', table: 'striped', totals: 'highlight-bar', qr: 'framed', footer: 'bar' },
    tags: ['transport', 'premium', 'logistics'] },
  { id: 'transport-logistics', name: 'نقل لوجستي', en: 'Transport Logistics', cat: 'Transport',
    theme: { primary: '#0f766e', accent: '#14b8a6', line: '#cfe9e5' },
    fonts: { base: 'Tajawal', heading: 'Cairo' },
    L: { header: 'split', customer: 'labeled-rows', table: 'grid', totals: 'boxed-right', qr: 'corner', footer: 'bar' },
    tags: ['transport', 'logistics', 'teal'] },
  { id: 'transport-fleet', name: 'نقل أسطول', en: 'Transport Fleet', cat: 'Transport',
    theme: { primary: '#1f2937', accent: '#f59e0b', line: '#e3e6ea' },
    fonts: { base: 'Cairo', heading: 'Cairo' },
    L: { header: 'darkbar', customer: 'boxed', table: 'dark-header', totals: 'stacked-card', qr: 'framed', footer: 'signature-stamp' },
    tags: ['transport', 'fleet', 'industrial'] },

  // ---- Travel Agency ----
  { id: 'travel-classic', name: 'سياحة كلاسيك', en: 'Travel Agency Classic', cat: 'Travel Agency',
    theme: { primary: '#9d174d', accent: '#db2777', line: '#f1d6e2' },
    fonts: { base: 'Tajawal', heading: 'Cairo' },
    L: { header: 'centered', customer: 'card', table: 'striped', totals: 'boxed-right', qr: 'captioned', footer: 'centered-note' },
    tags: ['travel', 'classic', 'warm'] },
  { id: 'travel-modern', name: 'سياحة مودرن', en: 'Travel Agency Modern', cat: 'Travel Agency',
    theme: { primary: '#0284c7', accent: '#f43f5e', line: '#d8eaf5' },
    fonts: { base: 'Tajawal', heading: 'Cairo' },
    L: { header: 'hero', customer: 'inline-strip', table: 'pill', totals: 'highlight-bar', qr: 'circle-badge', footer: 'gradient' },
    tags: ['travel', 'modern', 'vibrant'] },
  { id: 'travel-premium', name: 'سياحة بريميوم', en: 'Travel Agency Premium', cat: 'Travel Agency',
    theme: { primary: '#155e75', accent: '#c9a227', line: '#d6e7ec' },
    fonts: { base: 'Tajawal', heading: 'Cairo' },
    L: { header: 'ribbon', customer: 'two-col', table: 'boarding-pass', totals: 'gold-frame', qr: 'framed', footer: 'gradient' },
    tags: ['travel', 'premium', 'boarding-pass'] },

  // ---- Retail ----
  { id: 'retail-store', name: 'تجزئة متجر', en: 'Retail Store', cat: 'Retail',
    theme: { primary: '#7c3aed', accent: '#f59e0b', line: '#e7ddf7' },
    fonts: { base: 'Tajawal', heading: 'Cairo' },
    L: { header: 'band', customer: 'inline-strip', table: 'striped', totals: 'boxed-right', qr: 'framed', footer: 'bar' },
    tags: ['retail', 'store', 'friendly'] },
  { id: 'retail-pos', name: 'تجزئة كاشير', en: 'Retail POS', cat: 'Retail',
    theme: { primary: '#0f172a', accent: '#22c55e', line: '#e5e7eb' },
    fonts: { base: 'IBM Plex Sans Arabic', heading: 'IBM Plex Sans Arabic' },
    L: { header: 'stacked', customer: 'inline-strip', table: 'minimal-lines', totals: 'stacked-card', qr: 'plain', footer: 'centered-note' },
    tags: ['retail', 'pos', 'receipt'] },
  { id: 'retail-elegant', name: 'تجزئة أنيق', en: 'Retail Elegant', cat: 'Retail',
    theme: { primary: '#831843', accent: '#c9a227', line: '#efd9e2' },
    fonts: { base: 'Tajawal', heading: 'Cairo' },
    L: { header: 'centered', customer: 'card', table: 'grid', totals: 'gold-frame', qr: 'captioned', footer: 'signature-stamp' },
    tags: ['retail', 'elegant', 'boutique'] },

  // ---- Government / Official (formal, conservative colors for official entities) ----
  { id: 'government-navy', name: 'حكومي كحلي', en: 'Government Navy', cat: 'Government',
    theme: { primary: '#1e3a5f', accent: '#2c5282', line: '#d6deea', text: '#16243a', muted: '#5b6b80' },
    fonts: { base: 'IBM Plex Sans Arabic', heading: 'IBM Plex Sans Arabic' },
    L: { header: 'split', customer: 'labeled-rows', table: 'grid', totals: 'ledger', qr: 'framed', footer: 'signature-stamp' },
    tags: ['government', 'official', 'navy', 'formal', 'رسمي'] },
  { id: 'official-slate', name: 'رسمي إردوازي', en: 'Official Slate', cat: 'Government',
    theme: { primary: '#334155', accent: '#475569', line: '#dde3ea', muted: '#64748b' },
    fonts: { base: 'IBM Plex Sans Arabic', heading: 'IBM Plex Sans Arabic' },
    L: { header: 'sidebar', customer: 'boxed', table: 'minimal-lines', totals: 'boxed-right', qr: 'corner', footer: 'bar' },
    tags: ['government', 'official', 'slate', 'gray', 'رسمي'] },
  { id: 'ministry-green', name: 'أخضر وزاري', en: 'Ministry Green', cat: 'Government',
    theme: { primary: '#14532d', accent: '#15803d', line: '#d4e6d8', muted: '#5b7065' },
    fonts: { base: 'Tajawal', heading: 'Cairo' },
    L: { header: 'band', customer: 'card', table: 'dark-header', totals: 'boxed-right', qr: 'framed', footer: 'signature-stamp' },
    tags: ['government', 'official', 'green', 'ministry', 'رسمي'] },
  { id: 'burgundy-formal', name: 'عنابي رسمي', en: 'Burgundy Formal', cat: 'Government',
    theme: { primary: '#7f1d1d', accent: '#9b2c2c', line: '#ecd9d9', muted: '#7a6060' },
    fonts: { base: 'Tajawal', heading: 'Cairo' },
    L: { header: 'stacked', customer: 'two-col', table: 'grid', totals: 'ledger', qr: 'framed', footer: 'signature-stamp' },
    tags: ['government', 'official', 'burgundy', 'formal', 'رسمي'] },
  { id: 'graphite-letter', name: 'جرافيت رسمي', en: 'Graphite Letterhead', cat: 'Government',
    theme: { primary: '#111827', accent: '#374151', line: '#e3e6ea', muted: '#6b7280' },
    fonts: { base: 'IBM Plex Sans Arabic', heading: 'IBM Plex Sans Arabic' },
    L: { header: 'minimal-line', customer: 'labeled-rows', table: 'minimal-lines', totals: 'ledger', qr: 'plain', footer: 'centered-note' },
    tags: ['government', 'official', 'graphite', 'minimal', 'letterhead', 'رسمي'] },

  // ---- Additional formal Corporate / Executive (official palettes) ----
  { id: 'petrol-blue', name: 'أزرق بترولي', en: 'Petrol Blue', cat: 'Corporate',
    theme: { primary: '#0f4c5c', accent: '#0e7490', line: '#cfe0e4', muted: '#5a7177' },
    fonts: { base: 'Tajawal', heading: 'Cairo' },
    L: { header: 'split', customer: 'card', table: 'striped', totals: 'highlight-bar', qr: 'captioned', footer: 'centered-note' },
    tags: ['corporate', 'petrol', 'teal', 'formal'] },
  { id: 'steel-corporate', name: 'فولاذي كوربوريت', en: 'Steel Corporate', cat: 'Corporate',
    theme: { primary: '#1e293b', accent: '#3b6ea5', line: '#dbe2ea', muted: '#5f6b7a' },
    fonts: { base: 'IBM Plex Sans Arabic', heading: 'IBM Plex Sans Arabic' },
    L: { header: 'darkbar', customer: 'boxed', table: 'dark-header', totals: 'stacked-card', qr: 'framed', footer: 'bar' },
    tags: ['corporate', 'steel', 'formal', 'dark'] },
  { id: 'bronze-classic', name: 'برونزي كلاسيك', en: 'Bronze Classic', cat: 'Executive',
    theme: { primary: '#78350f', accent: '#a16207', line: '#ecdfcb', muted: '#7d6a54' },
    fonts: { base: 'Tajawal', heading: 'Cairo' },
    L: { header: 'ribbon', customer: 'card', table: 'grid', totals: 'boxed-right', qr: 'framed', footer: 'signature-stamp' },
    tags: ['executive', 'bronze', 'classic', 'formal'] },
];

// Per-template CSS identity (extra flourishes beyond the base/theme variables).
function css(t) {
  const id = t.id;
  const base = `/* ${t.en} — scoped identity */\n.tpl-${id}{}\n`;
  const extras = {
    'modern-glass': `.tpl-${id} .cust--card{backdrop-filter:blur(6px);background:rgba(255,255,255,.6);border-color:rgba(99,102,241,.25);box-shadow:0 8px 30px rgba(99,102,241,.12);}
.tpl-${id} .tot--card{box-shadow:0 10px 30px rgba(168,85,247,.18);}`,
    'modern-minimal': `.tpl-${id}{font-size:10.5pt;}
.tpl-${id} .hd-doctype{font-weight:600;}`,
    'executive-gold': `.tpl-${id} .hd-doctype-en{letter-spacing:.06em;}
.tpl-${id} .tbl--grid thead th{background:#1a1a1a;color:#c9a227;border-color:#c9a227;}`,
    'executive-dark': `.tpl-${id} .tbl--darkhead thead th{background:#0f172a;}
.tpl-${id} .tot--bar .tot-bar-grand{background:#0f172a;}`,
    'construction-pro': `.tpl-${id} .hd--band{background:repeating-linear-gradient(45deg,#9a3412 0 24px,#7c2d12 24px 48px);}
.tpl-${id} .tbl--grid thead th{text-transform:uppercase;}`,
    'construction-site': `.tpl-${id} .hd-rail{background:repeating-linear-gradient(45deg,#a16207 0 14px,#1f2937 14px 28px);}`,
    'construction-engineering': `.tpl-${id} .tbl--blueprint{letter-spacing:.02em;}`,
    'transport-fleet': `.tpl-${id} .hd--darkbar{border-bottom-width:5px;}`,
    'travel-premium': `.tpl-${id} .tbl--boarding tbody tr.bp-row td:first-child{border-inline-start:3px solid var(--c-accent);}`,
    'retail-pos': `.tpl-${id}{max-width:210mm;}
.tpl-${id} .tbl--minimal{font-family:'Courier New',monospace;}
.tpl-${id} .tot--card .tot-card-grand{background:#0f172a;}`,
    'retail-elegant': `.tpl-${id} .hd-doctype{font-style:italic;}`,

    // --- Government / formal: restrained letterhead details ---
    'government-navy': `.tpl-${id} .hd--split .hd-divider{width:2px;}
.tpl-${id} .hd-side--title{border-bottom:3px double var(--c-primary);padding-bottom:6px;}
.tpl-${id} .tbl--grid thead th{background:var(--c-primary);color:#fff;border-color:var(--c-primary);}
.tpl-${id} .tot--ledger .tot-ledger-grand td{border-color:var(--c-primary);}`,
    'official-slate': `.tpl-${id} .hd-rail{border-end-end-radius:0;}
.tpl-${id} .tbl--minimal thead th{color:var(--c-primary);border-bottom-color:var(--c-primary);}`,
    'ministry-green': `.tpl-${id} .hd--band{border-bottom:4px solid var(--c-accent);}
.tpl-${id} .tbl--darkhead thead th{background:var(--c-primary);}
.tpl-${id} .tot--boxed .tot-grand{background:var(--c-primary);}`,
    'burgundy-formal': `.tpl-${id} .hd--stacked .hd-title{background:var(--c-primary);}
.tpl-${id} .tbl--grid thead th{background:#fbeaea;color:var(--c-primary);border-color:#e3c4c4;}
.tpl-${id} .tot--ledger .tot-ledger-grand td{border-color:var(--c-primary);color:var(--c-primary);}`,
    'graphite-letter': `.tpl-${id}{font-size:10.5pt;}
.tpl-${id} .inv-header{border-top:4px solid var(--c-primary);padding-top:6mm;}
.tpl-${id} .hd--minimal .hd-min-row{border-bottom-width:2px;}
.tpl-${id} .tbl--minimal thead th .bl-en{letter-spacing:.06em;}`,
    'petrol-blue': `.tpl-${id} .hd--split .hd-divider{background:var(--c-primary);}
.tpl-${id} .tbl--striped thead th{background:var(--c-primary);}
.tpl-${id} .tot--bar .tot-bar-grand{background:var(--c-primary);}`,
    'steel-corporate': `.tpl-${id} .hd--darkbar{background:var(--c-primary);border-bottom-color:var(--c-accent);}
.tpl-${id} .tbl--darkhead thead th{background:var(--c-primary);}`,
    'bronze-classic': `.tpl-${id} .hd--ribbon{border-top-color:var(--c-accent);}
.tpl-${id} .hd-doctype-en{letter-spacing:.08em;}
.tpl-${id} .tbl--grid thead th{background:#f6efe3;color:var(--c-primary);border-color:#e0d2bb;}
.tpl-${id} .tot--boxed .tot-grand{background:var(--c-primary);}`,
  };
  return base + (extras[id] || `.tpl-${id} .hd-doctype{}\n`);
}

const index = [];
for (const t of T) {
  const dir = resolve(TPL_DIR, t.id);
  mkdirSync(dir, { recursive: true });
  const json = {
    id: t.id, name: t.name, nameEn: t.en, category: t.cat, tags: t.tags,
    builtin: true,
    theme: { text: '#0f172a', muted: '#64748b', bg: '#ffffff', ...t.theme },
    fonts: t.fonts,
    layout: {
      header: { variant: t.L.header },
      customer: { variant: t.L.customer },
      table: { variant: t.L.table },
      totals: { variant: t.L.totals },
      qr: { variant: t.L.qr },
      footer: { variant: t.L.footer },
    },
    columns: cols.full,
  };
  writeFileSync(resolve(dir, 'template.json'), JSON.stringify(json, null, 2) + '\n');
  writeFileSync(resolve(dir, 'template.css'), css(t));
  index.push({ id: t.id, name: t.name, nameEn: t.en, category: t.cat, tags: t.tags, builtin: true });
}

writeFileSync(resolve(TPL_DIR, 'templates.index.json'), JSON.stringify({ templates: index }, null, 2) + '\n');
console.log(`Generated ${T.length} templates + registry.`);
