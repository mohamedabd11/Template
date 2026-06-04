/**
 * InvoiceItem — a single line of an invoice.
 * DATABASE-READY: maps 1:1 to an `invoice_items` table (invoice_id FK, line ordering).
 */
export class InvoiceItem {
  constructor({ description = '', qty = 1, unitPrice = 0, taxRate = 0.15, discount = 0 } = {}) {
    this.description = description;
    this.qty = Number(qty) || 0;
    this.unitPrice = Number(unitPrice) || 0;
    this.taxRate = Number(taxRate);
    this.discount = Number(discount) || 0;
  }

  get subtotal() { return this.qty * this.unitPrice - this.discount; }
  get taxAmount() { return this.subtotal * this.taxRate; }
  get total() { return this.subtotal + this.taxAmount; }

  toJSON() {
    return { description: this.description, qty: this.qty, unitPrice: this.unitPrice,
      taxRate: this.taxRate, discount: this.discount };
  }

  static fromJSON(o = {}) { return new InvoiceItem(o); }
}
