/**
 * Company — the issuer (seller). Saudi fields: VAT number, CR (commercial registration).
 * DATABASE-READY: `companies` table; in multi-tenant SaaS this is scoped by tenant_id.
 */
export class Company {
  constructor({
    name = '', nameEn = '', vatNumber = '', crNumber = '',
    address = '', phone = '', email = '', logoDataUrl = '',
  } = {}) {
    Object.assign(this, { name, nameEn, vatNumber, crNumber, address, phone, email, logoDataUrl });
  }

  toJSON() { return { ...this }; }
  static fromJSON(o = {}) { return new Company(o); }
}
