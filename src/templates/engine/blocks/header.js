/**
 * Header block variants. Each returns an HTML string for `.inv-header`.
 * Variants differ structurally (layout, logo placement, title style) — the template's
 * scoped CSS then applies its visual identity.
 */
import { esc } from '../../../utils/dom.js';
import { bl, T } from '../labels.js';

function logo(c) {
  const co = c.invoice.company;
  if (co.logoDataUrl) return `<img class="hd-logo" src="${esc(co.logoDataUrl)}" alt="logo">`;
  // Fallback monogram from company name initial.
  const initial = esc((co.name || co.nameEn || '؟').trim().charAt(0));
  return `<div class="hd-logo hd-logo--mono">${initial}</div>`;
}

function companyBlock(c) {
  const co = c.invoice.company;
  return `
    <div class="hd-company">
      <div class="hd-name">${esc(co.name || 'اسم المنشأة')}</div>
      ${co.nameEn ? `<div class="hd-name-en">${esc(co.nameEn)}</div>` : ''}
      ${co.vatNumber ? `<div class="hd-meta">${T.vatNo[0]} / ${T.vatNo[1]}: ${esc(co.vatNumber)}</div>` : ''}
      ${co.crNumber ? `<div class="hd-meta">${T.crNo[0]} / ${T.crNo[1]}: ${esc(co.crNumber)}</div>` : ''}
      ${co.address ? `<div class="hd-meta">${esc(co.address)}</div>` : ''}
      ${co.phone ? `<div class="hd-meta">${esc(co.phone)}</div>` : ''}
    </div>`;
}

function titleBlock(c) {
  const inv = c.invoice;
  return `
    <div class="hd-title">
      <div class="hd-doctype">فاتورة ضريبية</div>
      <div class="hd-doctype-en">TAX INVOICE</div>
      <dl class="hd-fields">
        <div><dt>${bl('invoiceNo')}</dt><dd>${esc(inv.invoiceNumber || '—')}</dd></div>
        <div><dt>${bl('date')}</dt><dd>${esc(c.date(inv.date) || '—')}</dd></div>
        ${inv.dueDate ? `<div><dt>${bl('dueDate')}</dt><dd>${esc(c.date(inv.dueDate))}</dd></div>` : ''}
        ${inv.poNumber ? `<div><dt>${bl('po')}</dt><dd>${esc(inv.poNumber)}</dd></div>` : ''}
      </dl>
    </div>`;
}

export const headerBlocks = {
  // Colored band: logo on the right, title block on the left, company beneath.
  band: (c) => `
    <div class="hd hd--band">
      <div class="hd-band-top">
        <div class="hd-brand">${logo(c)}${companyBlock(c)}</div>
        ${titleBlock(c)}
      </div>
    </div>`,

  // Split header: company left, title right, divider between.
  split: (c) => `
    <div class="hd hd--split">
      <div class="hd-side hd-side--brand">${logo(c)}${companyBlock(c)}</div>
      <div class="hd-divider"></div>
      <div class="hd-side hd-side--title">${titleBlock(c)}</div>
    </div>`,

  // Centered: logo + company centered on top, title centered beneath.
  centered: (c) => `
    <div class="hd hd--centered">
      <div class="hd-center-brand">${logo(c)}${companyBlock(c)}</div>
      ${titleBlock(c)}
    </div>`,

  // Stacked: title on top as a strip, company info below it.
  stacked: (c) => `
    <div class="hd hd--stacked">
      ${titleBlock(c)}
      <div class="hd-stacked-brand">${logo(c)}${companyBlock(c)}</div>
    </div>`,

  // Sidebar: a vertical colored rail with the logo, content beside it.
  sidebar: (c) => `
    <div class="hd hd--sidebar">
      <div class="hd-rail">${logo(c)}</div>
      <div class="hd-rail-content">${companyBlock(c)}${titleBlock(c)}</div>
    </div>`,

  // Hero: full-width gradient banner with large title.
  hero: (c) => `
    <div class="hd hd--hero">
      <div class="hd-hero-bg"></div>
      <div class="hd-hero-inner">
        <div class="hd-brand">${logo(c)}${companyBlock(c)}</div>
        ${titleBlock(c)}
      </div>
    </div>`,

  // Dark bar: dark solid header, light text, accent underline.
  darkbar: (c) => `
    <div class="hd hd--darkbar">
      <div class="hd-brand">${logo(c)}${companyBlock(c)}</div>
      ${titleBlock(c)}
    </div>`,

  // Ribbon: luxury — thin top rule, centered serif title, gold ribbon corner.
  ribbon: (c) => `
    <div class="hd hd--ribbon">
      <span class="hd-ribbon-corner"></span>
      <div class="hd-brand">${logo(c)}${companyBlock(c)}</div>
      ${titleBlock(c)}
    </div>`,

  // Blueprint: technical grid background with stamp-like title box.
  blueprint: (c) => `
    <div class="hd hd--blueprint">
      <div class="hd-bp-grid"></div>
      <div class="hd-brand">${logo(c)}${companyBlock(c)}</div>
      <div class="hd-bp-stamp">${titleBlock(c)}</div>
    </div>`,

  // Letterhead (ZATCA detailed style): logo left, centered company names + CR, then a
  // "TAX INVOICE" title bar and the invoice-number row.
  letterhead: (c) => {
    const co = c.invoice.company; const inv = c.invoice;
    return `
    <div class="hd hd--letterhead">
      <div class="lh-top">
        <div class="lh-logo">${logo(c)}</div>
        <div class="lh-names">
          <div class="lh-name-ar">${esc(co.name || 'اسم المنشأة')}</div>
          ${co.nameEn ? `<div class="lh-name-en">${esc(co.nameEn)}</div>` : ''}
          ${co.crNumber ? `<div class="lh-cr">C.R. ${esc(co.crNumber)} &nbsp;·&nbsp; س.ت ${esc(co.crNumber)}</div>` : ''}
        </div>
        <div class="lh-logo lh-logo--spacer"></div>
      </div>
      <div class="lh-title">${T.taxInvoice[1]} &nbsp; · &nbsp; ${T.taxInvoice[0]}</div>
      <div class="lh-invno">
        <span><b>${esc(inv.invoiceNumber || '')}</b> ${T.invoiceNo[0]}</span>
        <span>Invoice No: <b>${esc(inv.invoiceNumber || '')}</b></span>
      </div>
    </div>`;
  },

  // Minimal line: just a hairline rule, tiny logo, compact title.
  'minimal-line': (c) => `
    <div class="hd hd--minimal">
      <div class="hd-min-row">
        <div class="hd-brand">${logo(c)}<span class="hd-name">${esc(c.invoice.company.name || 'المنشأة')}</span></div>
        <div class="hd-min-doc">${T.taxInvoice[0]} · ${T.taxInvoice[1]} · ${esc(c.invoice.invoiceNumber || '')}</div>
      </div>
      <div class="hd-min-sub">${esc(c.date(c.invoice.date))}</div>
    </div>`,
};
