/** Loads the bundled sample invoice (used for gallery previews & empty-state preview). */
import { Invoice } from '../models/Invoice.js';

const URL_ = new URL('../../assets/sample-invoice.json', import.meta.url);
let _cache = null;

export async function getSampleInvoice() {
  if (_cache) return _cache;
  const data = await fetch(URL_).then((r) => r.json());
  _cache = new Invoice(data);
  return _cache;
}
