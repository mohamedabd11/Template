/**
 * ublParser — parses a ZATCA / UBL 2.1 e-invoice XML (the one embedded inside Saudi
 * Phase-2 PDF/A-3 invoices) into our invoice payload. This gives COMPLETE, exact data
 * (line items, totals, seller, buyer, and the original QR) instead of text heuristics.
 *
 * Namespace-insensitive: we match by localName so cbc:/cac: prefixes don't matter.
 */

function parse(xmlString) {
  const doc = new DOMParser().parseFromString(xmlString, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) return null;
  const root = doc.documentElement;
  if (!root || root.localName !== 'Invoice') return null;
  return doc;
}

const kids = (el, name) => Array.from(el?.children || []).filter((c) => c.localName === name);
const kid = (el, name) => kids(el, name)[0] || null;

/** All descendants with a given localName (any depth). */
const desc = (el, name) => Array.from(el?.getElementsByTagName('*') || []).filter((e) => e.localName === name);
const firstDesc = (el, name) => desc(el, name)[0] || null;
const textOf = (el) => (el ? el.textContent.trim() : '');
/** Text of first descendant by localName, scoped to `el`. */
const dtext = (el, name) => textOf(firstDesc(el, name));
const numOf = (s) => { const n = parseFloat(String(s || '').replace(/,/g, '')); return isNaN(n) ? null : n; };

function party(partyWrapper) {
  if (!partyWrapper) return {};
  const p = firstDesc(partyWrapper, 'Party');
  if (!p) return {};
  const name = dtext(firstDesc(p, 'PartyLegalEntity'), 'RegistrationName')
    || dtext(firstDesc(p, 'PartyName'), 'Name');
  const vatNumber = dtext(firstDesc(p, 'PartyTaxScheme'), 'CompanyID') || '';
  const addr = firstDesc(p, 'PostalAddress');
  const address = addr
    ? [dtext(addr, 'StreetName'), dtext(addr, 'BuildingNumber'), dtext(addr, 'CityName'),
       dtext(addr, 'PostalZone'), dtext(addr, 'CountrySubentity')].filter(Boolean).join('، ')
    : '';
  return { name: name || '', vatNumber, address };
}

function extractQr(root) {
  // ZATCA QR lives in an AdditionalDocumentReference whose ID == 'QR'.
  for (const ref of desc(root, 'AdditionalDocumentReference')) {
    if (textOf(kid(ref, 'ID')) === 'QR') {
      const bin = firstDesc(ref, 'EmbeddedDocumentBinaryObject');
      if (bin) return textOf(bin); // base64 TLV payload — preserved verbatim
    }
  }
  return null;
}

function lineItems(root) {
  return desc(root, 'InvoiceLine').map((line) => {
    // UBL uses `InvoicedQuantity` (with a "d"); keep `InvoiceQuantity` as a lenient fallback.
    const qty = numOf(dtext(line, 'InvoicedQuantity')) ?? numOf(dtext(line, 'InvoiceQuantity')) ?? 1;
    const lineExt = numOf(dtext(line, 'LineExtensionAmount')) ?? 0;
    const priceEl = firstDesc(line, 'Price');
    const unitPrice = numOf(dtext(priceEl, 'PriceAmount')) ?? (qty ? lineExt / qty : 0);
    const itemEl = firstDesc(line, 'Item');
    const description = dtext(itemEl, 'Name') || dtext(line, 'Name') || 'بند';
    // tax percent from the line's tax category if present
    const pct = numOf(dtext(firstDesc(line, 'ClassifiedTaxCategory'), 'Percent'));
    const taxRate = pct != null ? pct / 100 : 0.15;
    return { description, qty, unitPrice, discount: 0, taxRate };
  });
}

/**
 * @returns {null | { payload, found, items, qrContent, mode:'ubl' }}
 */
export function parseUblInvoice(xmlString) {
  const doc = parse(xmlString);
  if (!doc) return null;
  const root = doc.documentElement;

  const invoiceNumber = textOf(kid(root, 'ID'));
  const date = textOf(kid(root, 'IssueDate'));
  const dueDate = textOf(kid(root, 'DueDate'));

  const company = party(firstDesc(root, 'AccountingSupplierParty'));
  const customer = party(firstDesc(root, 'AccountingCustomerParty'));

  const lmt = firstDesc(root, 'LegalMonetaryTotal');
  const subtotal = numOf(dtext(lmt, 'TaxExclusiveAmount')) ?? numOf(dtext(lmt, 'LineExtensionAmount'));
  const total = numOf(dtext(lmt, 'TaxInclusiveAmount')) ?? numOf(dtext(lmt, 'PayableAmount'));
  const discount = numOf(dtext(lmt, 'AllowanceTotalAmount')) || 0;
  // Document-level tax total (first TaxTotal that carries a TaxAmount).
  let tax = null;
  for (const tt of kids(root, 'TaxTotal')) { const t = numOf(dtext(tt, 'TaxAmount')); if (t != null) { tax = t; break; } }

  const items = lineItems(root);
  const qrContent = extractQr(root);

  const found = [];
  if (invoiceNumber) found.push('invoiceNumber');
  if (date) found.push('date');
  if (customer.name) found.push('customer');
  if (total != null) found.push('total');
  if (items.length) found.push('items');

  return {
    mode: 'ubl',
    qrContent,
    items,
    found,
    payload: {
      invoiceNumber, date, dueDate,
      company, customer,
      items,
      originalTotals: { subtotal, tax, total, discount },
      qrContent,
      currency: textOf(kid(root, 'DocumentCurrencyCode')) || 'SAR',
    },
  };
}
