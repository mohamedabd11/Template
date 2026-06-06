/**
 * OcrService — uses Tesseract.js (lazy-loaded UMD) to OCR an uploaded invoice image
 * (PNG/JPG/JPEG) in Arabic + English, then parses fields. User reviews the result.
 */
import { CDN } from '../core/config.js';
import { loadScript } from '../utils/qrUtils.js';
import { parseInvoiceText } from './parsers/fieldParser.js';

export const OcrService = {
  /**
   * @param {File|string} image  File or data URL
   * @param {(p:number)=>void} onProgress  0..1
   */
  async extract(image, onProgress) {
    await loadScript(CDN.tesseract);
    const { recognize } = window.Tesseract;
    const { data } = await recognize(image, 'ara+eng', {
      logger: (m) => { if (m.status === 'recognizing text' && onProgress) onProgress(m.progress); },
    });
    return parseInvoiceText(data.text);
  },
};
