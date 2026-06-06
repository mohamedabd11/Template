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
  const crNumber = (() => {
    const pid = firstDesc(p, 'PartyIdentification');
    return pid ? textOf(firstDesc(pid, 'ID')) : '';
  })();
  const addr = firstDesc(p, 'PostalAddress');
  const part = (n) => (addr ? dtext(addr, n) : '');
  const street = part('StreetName');
  const buildingNumber = part('BuildingNumber');
  const additionalNumber = part('PlotIdentification');
  const district = part('CitySubdivisionName');
  const city = part('CityName');
  const postalCode = part('PostalZone');
  const country = part('IdentificationCode') || part('Name');
  const address = [street, buildingNumber, district, city, postalCode, country].filter(Boolean).join('، ');
  return { name: name || '', vatNumber, crNumber, address, street, buildingNumber, additionalNumber, district, city, postalCode, country };
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
    const code = dtext(firstDesc(itemEl, 'SellersItemIdentification'), 'ID')
      || dtext(firstDesc(itemEl, 'BuyersItemIdentification'), 'ID') || '';
    const unitCode = firstDesc(line, 'InvoicedQuantity')?.getAttribute('unitCode') || '';
    const discount = numOf(dtext(firstDesc(line, 'AllowanceCharge'), 'Amount')) || 0;
    // tax percent from the line's tax category if present
    const pct = numOf(dtext(firstDesc(line, 'ClassifiedTaxCategory'), 'Percent'));
    const taxRate = pct != null ? pct / 100 : 0.15;
    return { description, code, unit: unitCode, qty, unitPrice, discount, taxRate };
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
  const uuid = textOf(kid(root, 'UUID'));
  const transactionCode = kid(root, 'InvoiceTypeCode')?.getAttribute('name') || '';
  const date = textOf(kid(root, 'IssueDate'));
  const dueDate = textOf(kid(root, 'DueDate'));
  // Supply date & references (used by the detailed ZATCA template).
  let supplyDate = '';
  for (const d of desc(root, 'Delivery')) { const v = dtext(d, 'ActualDeliveryDate'); if (v) { supplyDate = v; break; } }
  const poNumber = dtext(firstDesc(root, 'OrderReference'), 'ID') || '';
  const project = dtext(firstDesc(root, 'ContractDocumentReference'), 'ID') || '';
  let invoicePeriod = '';
  const ip = firstDesc(root, 'InvoicePeriod');
  if (ip) { const s = dtext(ip, 'StartDate'); const e = dtext(ip, 'EndDate'); if (s || e) invoicePeriod = [s, e].filter(Boolean).join(' — '); }

  const company = party(firstDesc(root, 'AccountingSupplierParty'));
  const customer = party(firstDesc(root, 'AccountingCustomerParty'));

  // Bank/payment details from PaymentMeans (when the XML includes them).
  const pm = firstDesc(root, 'PaymentMeans');
  if (pm) {
    const acc = firstDesc(pm, 'PayeeFinancialAccount');
    if (acc) {
      company.iban = dtext(acc, 'ID') || '';
      company.payeeName = dtext(acc, 'Name') || '';
      company.bankName = dtext(firstDesc(acc, 'FinancialInstitutionBranch'), 'Name') || '';
    }
  }

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
      invoiceNumber, uuid, transactionCode, date, dueDate, supplyDate, invoicePeriod, poNumber, project,
      company, customer,
      items,
      originalTotals: { subtotal, tax, total, discount },
      qrContent,
      currency: textOf(kid(root, 'DocumentCurrencyCode')) || 'SAR',
    },
  };
}
