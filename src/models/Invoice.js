/**
 * Invoice — the central domain model. Represents the ORIGINAL invoice being re-designed.
 * The studio never alters source figures; computed getters are display conveniences and,
 * when provided, original totals (`originalTotals`) take precedence over recomputation so
 * we faithfully reproduce the source document.
 *
 * DATABASE-READY: maps to an `invoices` table (+ invoice_items child rows). `id` is a UUID.
 */
import { InvoiceItem } from './InvoiceItem.js';
import { Company } from './Company.js';
import { Customer } from './Customer.js';

export class Invoice {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.invoiceNumber = data.invoiceNumber || '';
    this.date = data.date || '';
    this.dueDate = data.dueDate || '';
    this.supplyDate = data.supplyDate || '';
    this.invoicePeriod = data.invoicePeriod || '';
    this.poNumber = data.poNumber || '';
    this.project = data.project || '';
    this.notes = data.notes || '';
    this.currency = data.currency || 'SAR';
    this.transactionCode = data.transactionCode || ''; // ZATCA InvoiceTypeCode @name (e.g. 0100000)
    this.uuid = data.uuid || '';

    this.company = data.company instanceof Company ? data.company : Company.fromJSON(data.company || {});
    this.customer = data.customer instanceof Customer ? data.customer : Customer.fromJSON(data.customer || {});
    this.items = (data.items || []).map((i) => (i instanceof InvoiceItem ? i : InvoiceItem.fromJSON(i)));

    // Preserved QR payload from the source document (string) — kept verbatim.
    this.qrContent = data.qrContent || null;
    this.qrImageDataUrl = data.qrImageDataUrl || null;

    // If the source provided explicit totals, keep them to reproduce the document exactly.
    this.originalTotals = data.originalTotals || null; // { subtotal, tax, discount, total }

    this.createdAt = data.createdAt || new Date().toISOString();
    this.source = data.source || 'manual'; // manual | json | pdf | image
  }

  get subtotal() {
    if (this.originalTotals?.subtotal != null) return Number(this.originalTotals.subtotal);
    return this.items.reduce((s, i) => s + i.subtotal, 0);
  }

  get taxTotal() {
    if (this.originalTotals?.tax != null) return Number(this.originalTotals.tax);
    return this.items.reduce((s, i) => s + i.taxAmount, 0);
  }

  get discountTotal() {
    if (this.originalTotals?.discount != null) return Number(this.originalTotals.discount);
    return this.items.reduce((s, i) => s + i.discount, 0);
  }

  get grandTotal() {
    if (this.originalTotals?.total != null) return Number(this.originalTotals.total);
    return this.subtotal + this.taxTotal;
  }

  validate() {
    const errors = [];
    if (!this.invoiceNumber) errors.push('رقم الفاتورة مطلوب');
    if (!this.date) errors.push('تاريخ الفاتورة مطلوب');
    if (!this.customer?.name) errors.push('اسم العميل مطلوب');
    if (!this.items.length) errors.push('يجب إضافة بند واحد على الأقل');
    return { valid: errors.length === 0, errors };
  }

  toJSON() {
    return {
      id: this.id, invoiceNumber: this.invoiceNumber, date: this.date, dueDate: this.dueDate,
      supplyDate: this.supplyDate, invoicePeriod: this.invoicePeriod, poNumber: this.poNumber, project: this.project,
      notes: this.notes, currency: this.currency,
      transactionCode: this.transactionCode, uuid: this.uuid,
      company: this.company.toJSON(), customer: this.customer.toJSON(),
      items: this.items.map((i) => i.toJSON()),
      qrContent: this.qrContent, qrImageDataUrl: this.qrImageDataUrl,
      originalTotals: this.originalTotals, createdAt: this.createdAt, source: this.source,
    };
  }

  static fromJSON(o = {}) { return new Invoice(o); }
}
