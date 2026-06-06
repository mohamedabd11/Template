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
import { footerBlocks, buildBankTable, hasBankDetails } from './blocks/footer.js';
import { headerBlocks as headers } from './blocks/header.js';
import { T } from './labels.js';
import { money, num, date, toArabicDigits } from '../../utils/format.js';
import { tafqeet, tafqeetEn } from '../../utils/tafqeet.js';
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

/** Blend a hex color toward white by `pct` (0..1 of the color). Returns rgb() — html2canvas-safe. */
function tint(hex, pct) {
  let h = String(hex || '#1c3c7a').replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const m = (c) => Math.round((isNaN(c) ? 0 : c) * pct + 255 * (1 - pct));
  return `rgb(${m(r)}, ${m(g)}, ${m(b)})`;
}

/** Create an empty A4 page element with the template's theme CSS variables applied. */
function newPage(template, ctx, extraClass = '') {
  const page = document.createElement('div');
  page.className = `invoice-page tpl-${template.id}${extraClass ? ` ${extraClass}` : ''}`;
  page.setAttribute('dir', 'rtl');
  page.lang = 'ar';
  const primary = ctx.theme.primary || '#1e3a8a';
  const accent = ctx.theme.accent || primary;
  page.style.setProperty('--c-primary', primary);
  page.style.setProperty('--c-accent', accent);
  page.style.setProperty('--c-text', ctx.theme.text || '#0f172a');
  page.style.setProperty('--c-muted', ctx.theme.muted || '#64748b');
  page.style.setProperty('--c-bg', ctx.theme.bg || '#ffffff');
  page.style.setProperty('--c-line', ctx.theme.line || '#e2e8f0');
  // Pre-computed light tints (replace CSS color-mix() which html2canvas can't parse).
  page.style.setProperty('--c-soft', tint(primary, 0.08));
  page.style.setProperty('--c-soft-accent', tint(accent, 0.07));
  page.style.setProperty('--font-base', ctx.fonts.base || 'Tajawal');
  page.style.setProperty('--font-heading', ctx.fonts.heading || 'Cairo');
  applyLetterhead(page, ctx.letterhead);
  return page;
}

/** Apply letterhead ("ورق مروّس"): background image (digital) and safe-area margins so the
 *  content sits in the blank middle of the official paper. */
function applyLetterhead(page, lh) {
  if (!lh || !lh.enabled) return;
  page.classList.add('has-letterhead');
  const m = lh.margins || {};
  page.style.setProperty('--pad', `${m.side ?? 16}mm`);
  page.style.paddingTop = `${m.top ?? 38}mm`;
  page.style.paddingBottom = `${m.bottom ?? 26}mm`;
  if (lh.showBackground && lh.imageDataUrl) {
    page.style.backgroundImage = `url("${lh.imageDataUrl}")`;
    page.style.backgroundSize = '100% 100%';
    page.style.backgroundRepeat = 'no-repeat';
    page.style.backgroundPosition = 'center';
  }
}

function buildContext(invoice, template) {
  const theme = template.theme || {};
  return {
    invoice, template, theme,
    fonts: template.fonts || {},
    columns: template.columns || [],
    layout: template.layout || {},
    letterhead: invoice.letterhead || null,
    qr: { content: invoice.qrContent, imageDataUrl: invoice.qrImageDataUrl },
    // formatting helpers (display-only)
    money, num, date, esc, tafqeet, tafqeetEn, toArabicDigits,
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

    const page = newPage(template, ctx);

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

  /** Whether a separate bank-details page should be produced for this invoice. */
  hasBankPage(invoice) { return hasBankDetails(invoice); },

  /**
   * Render the bank/payment details as its OWN A4 page (page 2 of the PDF). Carries the same
   * letterhead so it's clearly tied to the invoice.
   * @returns {HTMLElement|null}
   */
  renderBankPage(invoice, template) {
    if (!hasBankDetails(invoice)) return null;
    ensureCss(template);
    const ctx = buildContext(invoice, template);
    const page = newPage(template, ctx, 'bank-page');
    const header = (headers.letterhead || pick('header', 'letterhead'))(ctx);
    page.innerHTML = `
      <div class="inv-header">${header}</div>
      <div class="inv-body">
        <div class="bank-page-title">${T.paymentDetails[0]} · ${T.paymentDetails[1]}</div>
        ${buildBankTable(ctx)}
      </div>
      <div class="inv-footer">${(footerBlocks.address)(ctx)}</div>
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
