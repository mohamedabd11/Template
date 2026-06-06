/**
 * Customer — the buyer. Includes ZATCA structured address parts (for the detailed template).
 * DATABASE-READY: `customers` table (tenant-scoped in SaaS).
 */
export class Customer {
  constructor({
    name = '', vatNumber = '', crNumber = '', address = '', phone = '', email = '',
    buildingNumber = '', street = '', district = '', additionalNumber = '',
    postalCode = '', city = '', country = '',
  } = {}) {
    Object.assign(this, {
      name, vatNumber, crNumber, address, phone, email,
      buildingNumber, street, district, additionalNumber, postalCode, city, country,
    });
  }

  toJSON() { return { ...this }; }
  static fromJSON(o = {}) { return new Customer(o); }
}
