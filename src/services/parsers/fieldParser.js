/**
 * fieldParser — heuristics shared by PDF & OCR import to pull invoice fields from raw text.
 * It is intentionally forgiving: anything it can't find is left empty for the user to fill in
 * the ReviewPanel. It NEVER fabricates values.
 *
 * Tuned for Arabic + English Saudi invoices (فاتورة / Invoice, الإجمالي / Total, ...).
 */

const RX = {
  invoiceNumber: [
    /(?:رقم\s*الفاتورة|invoice\s*(?:no|number|#)?)\s*[:#]?\s*([A-Za-z0-9\-\/]+)/i,
    /\bINV[-\s]?([A-Za-z0-9\-\/]+)/i,
  ],
  date: [
    /(?:التاريخ|تاريخ\s*الفاتورة|invoice\s*date|date)\s*[:]?\s*(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i,
    /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
  ],
  vatNumber: [/(?:الرقم\s*الضريبي|vat\s*(?:no|number)?|tax\s*number)\s*[:#]?\s*(\d{10,15})/i],
  total: [
    /(?:الإجمالي\s*المستحق|الإجمالي\s*شامل|المجموع\s*الكلي|grand\s*total|total\s*due|amount\s*due)\s*[:]?\s*([\d,]+\.?\d*)/i,
    /(?:الإجمالي|total)\s*[:]?\s*([\d,]+\.?\d*)/i,
  ],
  vat: [/(?:ضريبة\s*القيمة\s*المضافة|قيمة\s*الضريبة|vat\s*amount|tax)\s*(?:\(15%\))?\s*[:]?\s*([\d,]+\.?\d*)/i],
  subtotal: [/(?:الإجمالي\s*قبل\s*الضريبة|المجموع\s*الفرعي|subtotal|sub-total)\s*[:]?\s*([\d,]+\.?\d*)/i],
  customer: [
    /(?:فاتورة\s*إلى|اسم\s*العميل|العميل|bill\s*to|customer)\s*[:]?\s*(.+)/i,
  ],
};

function firstMatch(text, patterns) {
  for (const rx of patterns) {
    const m = text.match(rx);
    if (m && m[1]) return m[1].trim();
  }
  return '';
}

function toNumber(s) {
  if (!s) return null;
  const n = parseFloat(String(s).replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

/**
 * Parse raw text into a partial invoice payload + a list of fields that were found,
 * so the UI can highlight what needs manual review.
 */
export function parseInvoiceText(rawText) {
  const text = String(rawText || '').replace(/ /g, ' ');
  const invoiceNumber = firstMatch(text, RX.invoiceNumber);
  const date = firstMatch(text, RX.date);
  const customer = firstMatch(text, RX.customer).split(/\s{2,}|\n/)[0] || '';
  const vatNumber = firstMatch(text, RX.vatNumber);

  const total = toNumber(firstMatch(text, RX.total));
  const vat = toNumber(firstMatch(text, RX.vat));
  const subtotal = toNumber(firstMatch(text, RX.subtotal));

  const found = [];
  if (invoiceNumber) found.push('invoiceNumber');
  if (date) found.push('date');
  if (customer) found.push('customer');
  if (total != null) found.push('total');

  const originalTotals = (total != null || vat != null || subtotal != null)
    ? { total, tax: vat, subtotal, discount: null } : null;

  return {
    payload: {
      invoiceNumber,
      date,
      customer: { name: customer, vatNumber },
      originalTotals,
    },
    found,
    rawText: text,
  };
}
