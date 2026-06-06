/**
 * QrService — the 4 QR options required:
 *   1) uploadImage      : use a ready QR image as-is
 *   2) readFromImage    : decode QR content from an image (jsQR)
 *   3) readFromPdf      : render a PDF page and decode the QR from it
 *   4) regenerate       : re-draw a QR from extracted/known content (qrcode)
 *
 * IMPORTANT POLICY: if a QR is extracted from the original invoice, its CONTENT is preserved
 * verbatim. A new QR is only generated when the user explicitly requests `regenerate`.
 */
import { CDN } from '../core/config.js';
import { loadScript, decodeZatcaTLV } from '../utils/qrUtils.js';
import { qrDataURL } from '../utils/qrcode.js';
import { PdfImportService } from './PdfImportService.js';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function imageToCanvas(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = reject;
    img.src = src;
  });
}

async function decodeCanvas(canvas) {
  await loadScript(CDN.jsQR);
  const ctx = canvas.getContext('2d');
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const result = window.jsQR(data, width, height);
  if (!result) return null;
  return { content: result.data, decoded: decodeZatcaTLV(result.data) };
}

export const QrService = {
  /** Option 1: keep an uploaded QR image as-is (no content decoding required). */
  async uploadImage(file) {
    const dataUrl = await fileToDataUrl(file);
    // Best-effort: also try to read its content so totals/seller can be shown if ZATCA.
    let content = null, decoded = null;
    try { const canvas = await imageToCanvas(dataUrl); const r = await decodeCanvas(canvas); if (r) { content = r.content; decoded = r.decoded; } } catch { /* keep image only */ }
    return { imageDataUrl: dataUrl, content, decoded };
  },

  /** Option 2: read QR content from an image file. */
  async readFromImage(file) {
    const dataUrl = await fileToDataUrl(file);
    const canvas = await imageToCanvas(dataUrl);
    const r = await decodeCanvas(canvas);
    if (!r) throw new Error('تعذر قراءة رمز QR من الصورة');
    return { imageDataUrl: dataUrl, content: r.content, decoded: r.decoded };
  },

  /** Option 3: read QR content from a PDF (scans pages until one decodes). */
  async readFromPdf(file, maxPages = 3) {
    for (let p = 1; p <= maxPages; p++) {
      let canvas;
      try { canvas = await PdfImportService.renderPageToCanvas(file, p, 2.5); }
      catch { break; }
      const r = await decodeCanvas(canvas);
      if (r) return { imageDataUrl: canvas.toDataURL('image/png'), content: r.content, decoded: r.decoded };
    }
    throw new Error('تعذر العثور على رمز QR داخل ملف PDF');
  },

  /**
   * Ensure an invoice has a QR IMAGE to display. If it already has an image, no-op. If it has
   * QR *content* (e.g. extracted from the original invoice / UBL) but no image, draw the image
   * from that same content — this is rendering the existing payload, not creating a new one.
   * Returns true if an image is now available.
   */
  async ensureImage(invoice) {
    if (!invoice) return false;
    if (invoice.qrImageDataUrl) return true;
    if (!invoice.qrContent) return false;
    try {
      const { imageDataUrl } = await this.regenerate(invoice.qrContent);
      invoice.qrImageDataUrl = imageDataUrl;
      return true;
    } catch {
      return false; // offline / lib unavailable — template shows placeholder
    }
  },

  /**
   * Option 4: (re)generate a QR image from content. Only called on explicit user action.
   * Preserves the SAME content string that was extracted from the original invoice.
   */
  async regenerate(content, opts = {}) {
    if (!content) throw new Error('لا يوجد محتوى لإنشاء رمز QR');
    // Local, dependency-free encoder — works offline and keeps data on-device.
    const imageDataUrl = qrDataURL(content, {
      ecc: opts.ecl || 'M',
      scale: opts.scale || 6,
      margin: opts.margin ?? 4,
    });
    return { imageDataUrl, content, decoded: decodeZatcaTLV(content) };
  },
};
