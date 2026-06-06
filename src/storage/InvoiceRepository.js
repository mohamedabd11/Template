/**
 * InvoiceRepository — persistence for invoices via the active StorageAdapter.
 * ROADMAP: when moving to a real DB, only the adapter changes; this API stays identical.
 */
import { adapter } from './index.js';
import { KEYS } from '../core/config.js';
import { Invoice } from '../models/Invoice.js';

export const InvoiceRepository = {
  async list() {
    const rows = await adapter.getAll(KEYS.invoices);
    return rows.map(Invoice.fromJSON);
  },

  async get(id) {
    const row = await adapter.get(KEYS.invoices, id);
    return row ? Invoice.fromJSON(row) : null;
  },

  async save(invoice) {
    await adapter.put(KEYS.invoices, invoice.id, invoice.toJSON());
    return invoice;
  },

  async remove(id) { await adapter.remove(KEYS.invoices, id); },
};
