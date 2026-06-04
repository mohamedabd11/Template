/**
 * TemplateEngine — renders an Invoice + Template config into an A4, RTL invoice DOM node.
 *
 * Design diversity comes from BLOCK VARIANTS: each region (header/customer/table/totals/qr/
 * footer) has multiple renderers; a template's `layout.<region>.variant` selects one. Combined
 * with the template's own scoped CSS, every template is genuinely different — not a recolor.
 *
 * Extensibility: adding a new template = new folder (template.json + template.css) + a registry
 * entry. No engine code changes needed (as long as it reuses existing variants; new variants are
 * added here once and reused by many templates).
 */
import { headerBlocks } from './blocks/header.js';
import { customerBlocks } from './blocks/customer.js';
import { tableBlocks } from './blocks/table.js';
import { totalsBlocks } from './blocks/totals.js';
import { qrBlocks } from './blocks/qr.js';
import { footerBlocks } from './blocks/footer.js';
import { money, num, date, toArabicDigits } from '../../utils/format.js';
import { tafqeet } from '../../utils/tafqeet.js';
import { esc } from '../../utils/dom.js';

const REGISTRY = {
  header: headerBlocks,
  customer: customerBlocks,
  table: tableBlocks,
  totals: totalsBlocks,
  qr: qrBlocks,
  footer: footerBlocks,
};

const _injectedCss = new Set();

/** Inject a template's scoped CSS once per template id. */
function ensureCss(template) {
  if (!template.css || _injectedCss.has(template.id)) return;
  const style = document.createElement('style');
  style.dataset.tpl = template.id;
  style.textContent = template.css;
  document.head.appendChild(style);
  _injectedCss.add(template.id);
}

function pick(region, variant) {
  const set = REGISTRY[region];
  return set[variant] || set[Object.keys(set)[0]];
}

function buildContext(invoice, template) {
  const theme = template.theme || {};
  return {
    invoice, template, theme,
    fonts: template.fonts || {},
    columns: template.columns || [],
    layout: template.layout || {},
    qr: { content: invoice.qrContent, imageDataUrl: invoice.qrImageDataUrl },
    // formatting helpers (display-only)
    money, num, date, esc, tafqeet, toArabicDigits,
  };
}

export const TemplateEngine = {
  /**
   * Render to a full A4 page element.
   * @returns {HTMLElement} `.invoice-page.tpl-<id>` root
   */
  render(invoice, template) {
    ensureCss(template);
    const ctx = buildContext(invoice, template);
    const L = template.layout || {};

    const page = document.createElement('div');
    page.className = `invoice-page tpl-${template.id}`;
    page.setAttribute('dir', 'rtl');
    page.lang = 'ar';
    page.style.setProperty('--c-primary', ctx.theme.primary || '#1e3a8a');
    page.style.setProperty('--c-accent', ctx.theme.accent || ctx.theme.primary || '#3b82f6');
    page.style.setProperty('--c-text', ctx.theme.text || '#0f172a');
    page.style.setProperty('--c-muted', ctx.theme.muted || '#64748b');
    page.style.setProperty('--c-bg', ctx.theme.bg || '#ffffff');
    page.style.setProperty('--c-line', ctx.theme.line || '#e2e8f0');
    page.style.setProperty('--font-base', ctx.fonts.base || 'Tajawal');
    page.style.setProperty('--font-heading', ctx.fonts.heading || 'Cairo');

    const header = pick('header', L.header?.variant)(ctx);
    const customer = pick('customer', L.customer?.variant)(ctx);
    const table = pick('table', L.table?.variant)(ctx);
    const totals = pick('totals', L.totals?.variant)(ctx);
    const qr = pick('qr', L.qr?.variant)(ctx);
    const footer = pick('footer', L.footer?.variant)(ctx);

    // The body section combines totals + qr; templates control side via CSS grid.
    page.innerHTML = `
      <div class="inv-header">${header}</div>
      <div class="inv-customer">${customer}</div>
      <div class="inv-body">${table}</div>
      <div class="inv-summary">
        <div class="inv-qr">${qr}</div>
        <div class="inv-totals">${totals}</div>
      </div>
      <div class="inv-footer">${footer}</div>
    `;
    return page;
  },

  /** Render a scaled mini-preview (used by the gallery cards). */
  renderPreview(invoice, template, scale = 0.32) {
    const wrap = document.createElement('div');
    wrap.className = 'tpl-preview-wrap';
    const page = this.render(invoice, template);
    page.style.transform = `scale(${scale})`;
    page.style.transformOrigin = 'top right';
    wrap.appendChild(page);
    return wrap;
  },
};
