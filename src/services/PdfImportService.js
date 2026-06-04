/**
 * PdfImportService — uses pdf.js (lazy-loaded ESM) to:
 *   1) extract text from a PDF for field parsing, and
 *   2) render pages to canvases (for QR scanning by QrService).
 *
 * Runs fully client-side. ROADMAP: heavy parsing could move server-side later.
 */
import { CDN } from '../core/config.js';
import { parseInvoiceText } from './parsers/fieldParser.js';

let _pdfjs = null;
async function getPdfjs() {
  if (_pdfjs) return _pdfjs;
  const mod = await import(/* @vite-ignore */ CDN.pdfjs);
  mod.GlobalWorkerOptions.workerSrc = CDN.pdfjsWorker;
  _pdfjs = mod;
  return mod;
}

async function loadDoc(file) {
  const pdfjs = await getPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  return pdfjs.getDocument({ data }).promise;
}

export const PdfImportService = {
  /** Extract all text and parse invoice fields. Returns the fieldParser result. */
  async extract(file) {
    const doc = await loadDoc(file);
    let text = '';
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      text += content.items.map((i) => i.str).join(' ') + '\n';
    }
    return parseInvoiceText(text);
  },

  /** Render the first (or given) page to a canvas — used to scan an embedded QR. */
  async renderPageToCanvas(file, pageNum = 1, scale = 2) {
    const doc = await loadDoc(file);
    const page = await doc.getPage(Math.min(pageNum, doc.numPages));
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width; canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    return canvas;
  },
};
