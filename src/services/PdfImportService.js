/**
 * PdfImportService — uses pdf.js (lazy-loaded ESM) to:
 *   1) extract text from a PDF for field parsing, and
 *   2) render pages to canvases (for QR scanning by QrService).
 *
 * Runs fully client-side. ROADMAP: heavy parsing could move server-side later.
 */
import { CDN } from '../core/config.js';
import { parseInvoiceText } from './parsers/fieldParser.js';
import { parseUblInvoice } from './parsers/ublParser.js';

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

/**
 * Reconstruct visual lines from pdf.js text items using their positions, so tables/rows are
 * preserved (critical for extracting line items from printed PDFs). Items are grouped by their
 * y-coordinate; within a line, Arabic (RTL) lines are read right-to-left, others left-to-right.
 */
function reconstructLines(items) {
  const rows = [];
  for (const it of items) {
    const str = it.str;
    if (!str || !str.trim()) continue;
    const x = it.transform[4];
    const y = it.transform[5];
    let row = rows.find((r) => Math.abs(r.y - y) <= 3);
    if (!row) { row = { y, items: [] }; rows.push(row); }
    row.items.push({ x, str });
  }
  rows.sort((a, b) => b.y - a.y); // top (larger y) to bottom
  return rows.map((r) => {
    const isRtl = /[؀-ۿ]/.test(r.items.map((i) => i.str).join(''));
    r.items.sort((a, b) => (isRtl ? b.x - a.x : a.x - b.x));
    return r.items.map((i) => i.str).join(' ').replace(/\s+/g, ' ').trim();
  }).join('\n');
}

/**
 * ZATCA Phase-2 PDFs (PDF/A-3) embed the full UBL invoice XML as an attachment.
 * If present, return the exact, complete data parsed from it.
 */
async function extractEmbeddedUbl(doc) {
  let attachments = null;
  try { attachments = await doc.getAttachments(); } catch { return null; }
  if (!attachments) return null;
  const dec = new TextDecoder('utf-8');
  for (const name of Object.keys(attachments)) {
    const content = attachments[name]?.content;
    if (!content) continue;
    const str = dec.decode(content);
    if (str.includes('<Invoice') || /\.xml$/i.test(name)) {
      const ubl = parseUblInvoice(str);
      if (ubl) return ubl;
    }
  }
  return null;
}

export const PdfImportService = {
  /**
   * Extract invoice data. Prefers embedded UBL XML (complete & exact); otherwise falls back
   * to text heuristics. Returns { mode:'ubl'|'text', payload, found, items?, qrContent?, rawText? }.
   */
  async extract(file) {
    const doc = await loadDoc(file);

    const ubl = await extractEmbeddedUbl(doc);
    if (ubl) return ubl;

    let text = '';
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      text += reconstructLines(content.items) + '\n';
    }
    return { mode: 'text', ...parseInvoiceText(text) };
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
