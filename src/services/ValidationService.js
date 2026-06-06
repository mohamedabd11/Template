/**
 * ValidationService — validates manual form data and imported JSON against the expected schema.
 */
export const ValidationService = {
  /** Validate the ERP-integration JSON shape. Returns {valid, errors, normalized}. */
  validateJson(obj) {
    const errors = [];
    if (typeof obj !== 'object' || obj == null) {
      return { valid: false, errors: ['الملف ليس كائن JSON صالح'], normalized: null };
    }
    if (!obj.invoiceNumber) errors.push('الحقل invoiceNumber مفقود');
    if (!obj.date) errors.push('الحقل date مفقود');
    if (!Array.isArray(obj.items)) errors.push('الحقل items يجب أن يكون مصفوفة');

    const normalized = {
      invoiceNumber: obj.invoiceNumber || '',
      date: obj.date || '',
      dueDate: obj.dueDate || '',
      poNumber: obj.poNumber || '',
      notes: obj.notes || '',
      currency: obj.currency || 'SAR',
      company: obj.company || {},
      customer: typeof obj.customer === 'string' ? { name: obj.customer } : (obj.customer || {}),
      items: (obj.items || []).map((it) => ({
        description: it.description || it.name || '',
        qty: Number(it.qty ?? it.quantity ?? 1),
        unitPrice: Number(it.unitPrice ?? it.price ?? 0),
        taxRate: it.taxRate != null ? Number(it.taxRate) : 0.15,
        discount: Number(it.discount ?? 0),
      })),
      originalTotals: obj.totals || obj.originalTotals || null,
      qrContent: obj.qrContent || obj.qr || null,
      source: 'json',
    };
    return { valid: errors.length === 0, errors, normalized };
  },
};
