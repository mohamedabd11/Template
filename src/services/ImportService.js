/**
 * ImportService — orchestrates all 4 input methods into a normalized Invoice (or a partial
 * payload for review). It does NOT mutate source figures; when totals are provided by the
 * source they are stored as `originalTotals` and reproduced faithfully.
 */
import { Invoice } from '../models/Invoice.js';
import { ValidationService } from './ValidationService.js';
import { PdfImportService } from './PdfImportService.js';
import { OcrService } from './OcrService.js';

export const ImportService = {
  /** Build an Invoice from a manual form payload. */
  fromManual(payload) {
    return new Invoice({ ...payload, source: 'manual' });
  },

  /** Validate + build an Invoice from ERP-style JSON text or object. */
  fromJson(input) {
    const obj = typeof input === 'string' ? JSON.parse(input) : input;
    const { valid, errors, normalized } = ValidationService.validateJson(obj);
    if (!valid) return { ok: false, errors };
    return { ok: true, invoice: new Invoice(normalized) };
  },

  /**
   * Extract a PARTIAL payload from a PDF for user review (not a finished invoice).
   * Returns { payload, found, rawText } from the field parser.
   */
  async fromPdf(file) {
    const result = await PdfImportService.extract(file);
    return { ...result, source: 'pdf' };
  },

  /** Extract a PARTIAL payload from an image via OCR for user review. */
  async fromImage(file, onProgress) {
    const result = await OcrService.extract(file, onProgress);
    return { ...result, source: 'image' };
  },

  /** Merge a reviewed partial payload into a full Invoice. */
  buildFromReviewed(payload, source = 'pdf') {
    return new Invoice({ ...payload, source });
  },
};
