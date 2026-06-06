/**
 * One-off generator: writes /src/templates/<id>/{template.json,template.css} and
 * /src/templates/templates.index.json from the design table below.
 * Kept in-repo so contributors can regenerate or add ZATCA templates consistently.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TPL_DIR = resolve(ROOT, 'src/templates');

// Detailed ZATCA invoice columns (labels resolved bilingually by the engine).
const cols = {
  zatca: [
    { key: 'index', label: '#', align: 'center', width: '3%' },
    { key: 'code', labelKey: 'codeSku', label: 'الرمز', align: 'center', width: '8%' },
    { key: 'description', labelKey: 'natureOfGoods', label: 'البيان', align: 'right', width: '21%' },
    { key: 'qty', label: 'الكمية', align: 'center', width: '8%' },
    { key: 'unit', label: 'الوحدة', align: 'center', width: '5%' },
    { key: 'unitPrice', label: 'سعر الوحدة', align: 'center', width: '9%' },
    { key: 'discount', label: 'الخصم', align: 'center', width: '7%' },
    { key: 'subtotalExcl', label: 'الإجمالي قبل الضريبة', align: 'center', width: '10%' },
    { key: 'taxRate', label: 'نسبة الضريبة', align: 'center', width: '7%' },
    { key: 'taxAmount', label: 'مبلغ الضريبة', align: 'center', width: '8%' },
    { key: 'subtotalIncl', label: 'الإجمالي شامل الضريبة', align: 'center', width: '12%' },
  ],
};

// ZATCA official detailed templates (the only templates shipped). Add more ZATCA color
// variants here as needed.
const T = [
  { id: 'zatca', name: 'زاتكا الرسمي', en: 'ZATCA Standard', cat: 'Government', cols: 'zatca',
    theme: { primary: '#1c3c7a', accent: '#2a4e92', line: '#cdd7ea', text: '#13213f', muted: '#5a6b86' },
    fonts: { base: 'Tajawal', heading: 'Tajawal' },
    L: { header: 'letterhead', customer: 'zatca-details', table: 'grid', totals: 'statement', qr: 'zatca', footer: 'address' },
    tags: ['government', 'zatca', 'official', 'detailed', 'رسمي', 'زاتكا'] },
  { id: 'zatca-green', name: 'زاتكا أخضر', en: 'ZATCA Green', cat: 'Government', cols: 'zatca',
    theme: { primary: '#0f5132', accent: '#198754', line: '#cfe3d6', text: '#10261b', muted: '#5a7065' },
    fonts: { base: 'Tajawal', heading: 'Tajawal' },
    L: { header: 'letterhead', customer: 'zatca-details', table: 'grid', totals: 'statement', qr: 'zatca', footer: 'address' },
    tags: ['government', 'zatca', 'official', 'detailed', 'green', 'رسمي', 'زاتكا'] },
  { id: 'zatca-gray', name: 'زاتكا رمادي', en: 'ZATCA Gray', cat: 'Government', cols: 'zatca',
    theme: { primary: '#374151', accent: '#4b5563', line: '#dde1e7', text: '#1f2937', muted: '#6b7280' },
    fonts: { base: 'IBM Plex Sans Arabic', heading: 'IBM Plex Sans Arabic' },
    L: { header: 'letterhead', customer: 'zatca-details', table: 'grid', totals: 'statement', qr: 'zatca', footer: 'address' },
    tags: ['government', 'zatca', 'official', 'detailed', 'gray', 'رسمي', 'زاتكا'] },
];

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
    columns: cols.zatca,
  };
  writeFileSync(resolve(dir, 'template.json'), JSON.stringify(json, null, 2) + '\n');
  writeFileSync(resolve(dir, 'template.css'), `/* ${t.en} — scoped identity (colors via CSS vars) */\n.tpl-${t.id}{}\n`);
  index.push({ id: t.id, name: t.name, nameEn: t.en, category: t.cat, tags: t.tags, builtin: true });
}

writeFileSync(resolve(TPL_DIR, 'templates.index.json'), JSON.stringify({ templates: index }, null, 2) + '\n');
console.log(`Generated ${T.length} ZATCA templates + registry.`);
