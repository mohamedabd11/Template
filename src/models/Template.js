/**
 * Template — a design definition (the "config" half of a template; CSS lives alongside).
 * DATABASE-READY: `templates` table. `builtin` distinguishes shipped templates from
 * user-created/customized ones stored in the data layer.
 */
export class Template {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.name = data.name || 'قالب بدون اسم';
    this.nameEn = data.nameEn || data.name || '';
    this.category = data.category || 'Corporate';
    this.tags = data.tags || [];
    this.theme = data.theme || {}; // { primary, accent, text, bg, muted, ... }
    this.fonts = data.fonts || { base: 'Tajawal', heading: 'Cairo' };
    this.layout = data.layout || {}; // { header, customer, table, totals, qr, footer }
    this.columns = data.columns || defaultColumns();
    this.css = data.css || ''; // raw template.css contents (injected by engine)
    this.builtin = data.builtin ?? false;
    this.basedOn = data.basedOn || null; // id of template this was copied/customized from
  }

  toJSON() {
    return {
      id: this.id, name: this.name, nameEn: this.nameEn, category: this.category,
      tags: this.tags, theme: this.theme, fonts: this.fonts, layout: this.layout,
      columns: this.columns, css: this.css, builtin: this.builtin, basedOn: this.basedOn,
    };
  }

  static fromJSON(o = {}) { return new Template(o); }
}

export function defaultColumns() {
  return [
    { key: 'index', label: '#', align: 'center', width: '6%' },
    { key: 'description', label: 'البيان', align: 'right', width: '40%' },
    { key: 'qty', label: 'الكمية', align: 'center', width: '12%' },
    { key: 'unitPrice', label: 'سعر الوحدة', align: 'center', width: '14%' },
    { key: 'taxAmount', label: 'الضريبة', align: 'center', width: '14%' },
    { key: 'total', label: 'الإجمالي', align: 'center', width: '14%' },
  ];
}
