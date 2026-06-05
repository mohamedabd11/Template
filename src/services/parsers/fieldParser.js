/**
 * fieldParser — heuristics shared by PDF & OCR import to pull invoice fields from raw text.
 * It works on reconstructed LINES (see PdfImportService.reconstructLines), so it can also
 * extract line items from tabular layouts. It is intentionally forgiving and NEVER fabricates
 * values — anything uncertain is left for the user to confirm/fix in the manual form.
 *
 * Tuned for Arabic + English Saudi invoices. Arabic-Indic digits are normalized to Latin.
 */

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
/** Convert Arabic-Indic digits to Latin and normalize the Arabic decimal mark. */
export function normalizeDigits(s) {
  return String(s ?? '')
    .replace(/[٠-٩]/g, (d) => AR_DIGITS.indexOf(d))
    .replace(/٫/g, '.') // arabic decimal separator
    .replace(/٬/g, ''); // arabic thousands separator
}

/** Parse a numeric token (handles 1,234.56 / ١٬٢٣٤٫٥٦ / 1 234,56). */
function toNumber(s) {
  if (s == null) return null;
  let t = normalizeDigits(String(s)).trim();
  if (!t) return null;
  t = t.replace(/[,\s](?=\d{3}\b)/g, ''); // thousands separators
  t = t.replace(/,(\d{1,2})$/, '.$1'); // comma decimal -> dot
  t = t.replace(/[^\d.]/g, '');
  const n = parseFloat(t);
  return isNaN(n) ? null : n;
}

/** Extract all numeric values appearing in a line, in reading order. */
function numbersIn(line) {
  const norm = normalizeDigits(line);
  const matches = norm.match(/\d{1,3}(?:[,\s]\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g) || [];
  return matches.map((m) => toNumber(m)).filter((n) => n != null);
}

const RX = {
  invoiceNumber: [
    /(?:رقم\s*الفاتورة|invoice\s*(?:no|number|#)?|فاتورة\s*رقم)\s*[:#.]?\s*([A-Za-z0-9٠-٩][A-Za-z0-9٠-٩\-\/]*)/i,
    /\bINV[-\s]?([A-Za-z0-9\-\/]+)/i,
  ],
  date: [
    /(?:التاريخ|تاريخ\s*الفاتورة|invoice\s*date|date|بتاريخ)\s*[:]?\s*(\d{4}[-\/.]\d{1,2}[-\/.]\d{1,2})/i,
    /(?:التاريخ|date)\s*[:]?\s*(\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4})/i,
    /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/,
    /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
  ],
  dueDate: [/(?:تاريخ\s*الاستحقاق|الاستحقاق|due\s*date)\s*[:]?\s*(\d{2,4}[-\/.]\d{1,2}[-\/.]\d{2,4})/i],
  poNumber: [/(?:أمر\s*الشراء|رقم\s*أمر\s*الشراء|po\s*(?:no|number|#)?|p\.o\.?)\s*[:#]?\s*([A-Za-z0-9\-\/]+)/i],
  sellerVat: [/(?:الرقم\s*الضريبي|vat\s*(?:no|number|reg)?|tax\s*(?:no|number))\s*[:#]?\s*(\d{15})/i],
  total: [
    /(?:الإجمالي\s*المستحق|الإجمالي\s*شامل|الإجمالي\s*شاملاً|المجموع\s*الكلي|الصافي|grand\s*total|total\s*due|amount\s*due|net\s*(?:total|amount))\s*[:]?\s*([\d,.]+)/i,
    /(?:الإجمالي|المجموع|total)\s*[:]?\s*([\d,.]+)/i,
  ],
  vat: [/(?:ضريبة\s*القيمة\s*المضافة|قيمة\s*الضريبة|إجمالي\s*الضريبة|مبلغ\s*الضريبة)\s*(?:\(?\s*15\s*%?\)?\s*[:]?)?\s*[:]?\s*([\d,.]+)/i,
    /(?:vat|tax)\s*(?:amount)?\s*(?:\(?\s*15\s*%?\)?)?\s*[:]?\s*([\d,.]+)/i],
  subtotal: [/(?:الإجمالي\s*قبل\s*الضريبة|المجموع\s*الفرعي|المبلغ\s*قبل\s*الضريبة|subtotal|sub-total|taxable\s*amount|net\s*before)\s*[:]?\s*([\d,.]+)/i],
  customer: [/(?:فاتورة\s*إلى|اسم\s*العميل|العميل|المشتري|bill\s*to|customer|buyer)\s*[:]?\s*(.+)/i],
  customerVat: [/(?:الرقم\s*الضريبي\s*للعميل|customer\s*vat|buyer\s*vat)\s*[:#]?\s*(\d{15})/i],
  seller: [/(?:المورد|البائع|اسم\s*المنشأة|المنشأة|seller|supplier|from)\s*[:]?\s*(.+)/i],
};

function firstMatch(text, patterns) {
  for (const rx of patterns) { const m = text.match(rx); if (m && m[1]) return m[1].trim(); }
  return '';
}

const TOTALS_KW = /(الإجمالي|المجموع|الصافي|ضريبة|الضريبة|القيمة\s*المضافة|المستحق|إجمالي|total|subtotal|sub-total|vat|tax|amount\s*due|balance|grand)/i;
const HEADER_KW = /(رقم\s*الفاتورة|التاريخ|الرقم\s*الضريبي|فاتورة\s*إلى|العميل|invoice|date|vat|bill\s*to|tel|هاتف|عنوان|address|سجل|c\.?r)/i;

/** Heuristically split a detected item line into description + figures. */
function parseItemLine(line) {
  const nums = numbersIn(line);
  if (nums.length < 2) return null;
  // description = the line with numeric tokens stripped
  const desc = normalizeDigits(line)
    .replace(/\d{1,3}(?:[,\s]\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g, ' ')
    .replace(/[|│┃•·\-–—#]+/g, ' ')
    .replace(/\s+/g, ' ').trim();
  if (desc.replace(/[^\p{L}]/gu, '').length < 3) return null; // needs real text

  const total = nums[nums.length - 1];
  let qty = null, unitPrice = null;

  // Best heuristic: find the pair (qty × unitPrice ≈ total). This ignores a leading row-index
  // column and a trailing tax column gracefully.
  const cand = nums.slice(0, -1);
  if (total > 0) {
    for (let i = 0; i < cand.length && qty == null; i++) {
      for (let j = 0; j < cand.length; j++) {
        if (i === j) continue;
        if (Math.abs(cand[i] * cand[j] - total) / total < 0.02) {
          // the integer-like factor is the quantity
          qty = Number.isInteger(cand[i]) ? cand[i] : cand[j];
          unitPrice = qty === cand[i] ? cand[j] : cand[i];
          break;
        }
      }
    }
  }
  if (qty == null) {
    unitPrice = nums[nums.length - 2] || total;
    const q = unitPrice > 0 ? total / unitPrice : 1;
    qty = q > 0 && q < 1e6 ? +q.toFixed(2) : 1;
  }
  return { description: desc, qty: qty || 1, unitPrice: unitPrice || 0, discount: 0, taxRate: 0.15 };
}

/**
 * Parse raw (line-structured) text into a partial invoice payload + which fields were found.
 */
export function parseInvoiceText(rawText) {
  // Normalize Arabic-Indic digits to Latin up front (fixes Arabic dates/amounts, Latin output).
  const text = normalizeDigits(String(rawText || '')).replace(/ /g, ' ');
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);

  const invoiceNumber = firstMatch(text, RX.invoiceNumber);
  const date = firstMatch(text, RX.date);
  const dueDate = firstMatch(text, RX.dueDate);
  const poNumber = firstMatch(text, RX.poNumber);
  const customer = (firstMatch(text, RX.customer).split(/\s{2,}|\|/)[0] || '').slice(0, 80).trim();
  const seller = (firstMatch(text, RX.seller).split(/\s{2,}|\|/)[0] || '').slice(0, 80).trim();
  const sellerVat = firstMatch(text, RX.sellerVat);
  const customerVat = firstMatch(text, RX.customerVat);

  const total = toNumber(firstMatch(text, RX.total));
  const vat = toNumber(firstMatch(text, RX.vat));
  const subtotal = toNumber(firstMatch(text, RX.subtotal));

  // Line items: candidate lines have text + >=2 numbers and are not totals/header lines.
  const items = [];
  for (const line of lines) {
    if (TOTALS_KW.test(line) || HEADER_KW.test(line)) continue;
    const nums = numbersIn(line);
    if (nums.length < 2) continue;
    const item = parseItemLine(line);
    if (item && item.unitPrice > 0) items.push(item);
  }

  const found = [];
  if (invoiceNumber) found.push('invoiceNumber');
  if (date) found.push('date');
  if (customer) found.push('customer');
  if (total != null) found.push('total');
  if (items.length) found.push('items');

  const hasTotals = total != null || vat != null || subtotal != null;
  const originalTotals = hasTotals ? { total, tax: vat, subtotal, discount: null } : null;

  // Fallback: if no items parsed but we have a total, seed one editable line for review.
  if (!items.length && (subtotal != null || total != null)) {
    items.push({ description: 'بند الفاتورة (للمراجعة)', qty: 1, unitPrice: subtotal ?? total, discount: 0, taxRate: 0.15 });
  }

  return {
    payload: {
      invoiceNumber, date, dueDate, poNumber,
      company: { name: seller, vatNumber: sellerVat },
      customer: { name: customer, vatNumber: customerVat },
      items,
      originalTotals,
    },
    found,
    rawText: text,
  };
}
