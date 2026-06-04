/**
 * Customer — the buyer.
 * DATABASE-READY: `customers` table (tenant-scoped in SaaS).
 */
export class Customer {
  constructor({ name = '', vatNumber = '', address = '', phone = '', email = '' } = {}) {
    Object.assign(this, { name, vatNumber, address, phone, email });
  }

  toJSON() { return { ...this }; }
  static fromJSON(o = {}) { return new Customer(o); }
}
