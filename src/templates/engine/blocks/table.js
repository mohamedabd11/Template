/**
 * Items table variants — different table shapes. All read `template.columns` for column config.
 */
import { esc } from '../../../utils/dom.js';
import { colLabel } from '../labels.js';

function cellValue(col, item, idx, c) {
  switch (col.key) {
    case 'index': return String(idx + 1);
    case 'code': return esc(item.code || '');
    case 'description': return esc(item.description);
    case 'qty': return c.num(item.qty);
    case 'unit': return esc(item.unit || '');
    case 'unitPrice': return c.money(item.unitPrice, false);
    case 'taxAmount': return c.money(item.taxAmount, false);
    case 'taxRate': return `${Math.round(item.taxRate * 100)}%`;
    case 'discount': return c.money(item.discount, false);
    case 'subtotal':
    case 'subtotalExcl': return c.money(item.subtotal, false);
    case 'subtotalIncl': return c.money(item.total, false);
    case 'total': return c.money(item.total, false);
    default: return esc(item[col.key] ?? '');
  }
}

function buildRows(c, rowClassFn = () => '') {
  return c.invoice.items.map((item, i) => `
    <tr class="${rowClassFn(i)}">
      ${c.columns.map((col) => `<td style="text-align:${col.align || 'right'}">${cellValue(col, item, i, c)}</td>`).join('')}
    </tr>`).join('');
}

function head(c) {
  return `<tr>${c.columns.map((col) => `<th style="text-align:${col.align || 'right'};width:${col.width || 'auto'}">${colLabel(col.key, esc(col.label))}</th>`).join('')}</tr>`;
}

export const tableBlocks = {
  // Zebra striped rows.
  striped: (c) => `
    <table class="tbl tbl--striped">
      <thead>${head(c)}</thead>
      <tbody>${buildRows(c, (i) => (i % 2 ? 'is-odd' : 'is-even'))}</tbody>
    </table>`,

  // Full grid borders.
  grid: (c) => `
    <table class="tbl tbl--grid">
      <thead>${head(c)}</thead>
      <tbody>${buildRows(c)}</tbody>
    </table>`,

  // Only horizontal hairlines, airy.
  'minimal-lines': (c) => `
    <table class="tbl tbl--minimal">
      <thead>${head(c)}</thead>
      <tbody>${buildRows(c)}</tbody>
    </table>`,

  // Dark header row, light body.
  'dark-header': (c) => `
    <table class="tbl tbl--darkhead">
      <thead>${head(c)}</thead>
      <tbody>${buildRows(c)}</tbody>
    </table>`,

  // Each row is a rounded "pill" card with spacing between rows.
  pill: (c) => `
    <table class="tbl tbl--pill">
      <thead>${head(c)}</thead>
      <tbody>${buildRows(c, () => 'pill-row')}</tbody>
    </table>`,

  // Technical blueprint grid (dashed, monospace numbers).
  blueprint: (c) => `
    <table class="tbl tbl--blueprint">
      <thead>${head(c)}</thead>
      <tbody>${buildRows(c)}</tbody>
    </table>`,

  // Boarding-pass styled rows (perforated look) — travel templates.
  'boarding-pass': (c) => `
    <table class="tbl tbl--boarding">
      <thead>${head(c)}</thead>
      <tbody>${buildRows(c, () => 'bp-row')}</tbody>
    </table>`,
};
