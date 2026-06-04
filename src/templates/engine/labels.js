/**
 * Bilingual (Arabic / English) labels for all invoice templates — Saudi/ZATCA style.
 * Values come from the source invoice; only LABELS are bilingual here.
 *
 * Each entry is [arabic, english]. Use:
 *   - bl(key)   → HTML: "العربية <span class="bl-en">English</span>" (Arabic primary, English secondary)
 *   - blText(key) → plain "العربية / English"
 */
export const T = {
  taxInvoice:     ['فاتورة ضريبية', 'Tax Invoice'],
  simplifiedTax:  ['فاتورة ضريبية مبسطة', 'Simplified Tax Invoice'],
  invoiceNo:      ['رقم الفاتورة', 'Invoice No.'],
  date:           ['التاريخ', 'Date'],
  dueDate:        ['تاريخ الاستحقاق', 'Due Date'],
  po:             ['أمر الشراء', 'PO Number'],
  vatNo:          ['الرقم الضريبي', 'VAT Number'],
  crNo:           ['السجل التجاري', 'CR Number'],

  billTo:         ['فاتورة إلى', 'Bill To'],
  customer:       ['العميل', 'Customer'],
  customerData:   ['بيانات العميل', 'Customer Details'],
  invoiceDetails: ['بيانات الفاتورة', 'Invoice Details'],
  address:        ['العنوان', 'Address'],
  phone:          ['الهاتف', 'Phone'],
  email:          ['البريد الإلكتروني', 'Email'],

  subtotal:       ['الإجمالي قبل الضريبة', 'Total (Excl. VAT)'],
  discount:       ['الخصم', 'Discount'],
  vat15:          ['ضريبة القيمة المضافة (15%)', 'VAT (15%)'],
  totalDue:       ['الإجمالي المستحق', 'Total Due'],
  amountInWords:  ['المبلغ كتابةً', 'Amount in words'],

  thanks:         ['شكراً لتعاملكم معنا', 'Thank you for your business'],
  signature:      ['التوقيع', 'Signature'],
  stamp:          ['الختم', 'Stamp'],
  scanVerify:     ['امسح للتحقق', 'Scan to verify'],
  scanCaption:    ['امسح الرمز للتحقق من الفاتورة الضريبية', 'Scan to verify the tax invoice'],

  // Table columns (by column key)
  col_index:      ['#', '#'],
  col_description:['البيان', 'Description'],
  col_qty:        ['الكمية', 'Qty'],
  col_unitPrice:  ['سعر الوحدة', 'Unit Price'],
  col_taxAmount:  ['الضريبة', 'VAT'],
  col_taxRate:    ['نسبة الضريبة', 'VAT %'],
  col_discount:   ['الخصم', 'Discount'],
  col_subtotal:   ['الإجمالي', 'Subtotal'],
  col_total:      ['الإجمالي', 'Total'],
};

/** Arabic primary + English secondary, as HTML. */
export function bl(key) {
  const e = T[key];
  if (!e) return '';
  return `${e[0]} <span class="bl-en">${e[1]}</span>`;
}

/** Plain "العربية / English". */
export function blText(key) {
  const e = T[key];
  return e ? `${e[0]} / ${e[1]}` : '';
}

/** Bilingual label for a table column key; falls back to the template-provided label. */
export function colLabel(key, fallback = '') {
  const e = T[`col_${key}`];
  if (!e) return fallback;
  if (e[0] === e[1]) return e[0];
  return `${e[0]}<span class="bl-en">${e[1]}</span>`;
}
