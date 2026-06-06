/**
 * Company — the issuer (seller). Saudi fields: VAT number, CR (commercial registration),
 * plus the ZATCA structured address parts (used by the detailed ZATCA template).
 * DATABASE-READY: `companies` table; in multi-tenant SaaS this is scoped by tenant_id.
 */
export class Company {
  constructor({
    name = '', nameEn = '', vatNumber = '', crNumber = '',
    address = '', phone = '', email = '', website = '', logoDataUrl = '',
    buildingNumber = '', street = '', district = '', additionalNumber = '',
    postalCode = '', city = '', country = '',
    payeeName = '', accountNumber = '', bankName = '', bankBranch = '', iban = '', swift = '',
  } = {}) {
    Object.assign(this, {
      name, nameEn, vatNumber, crNumber, address, phone, email, website, logoDataUrl,
      buildingNumber, street, district, additionalNumber, postalCode, city, country,
      payeeName, accountNumber, bankName, bankBranch, iban, swift,
    });
  }

  toJSON() { return { ...this }; }
  static fromJSON(o = {}) { return new Company(o); }
}
