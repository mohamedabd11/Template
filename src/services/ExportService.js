/**
 * ExportService — high-quality A4 PDF export (RTL/Arabic) via html2canvas + jsPDF,
 * plus native browser print. Renders the invoice DOM at high scale, then paginates onto
 * A4 pages so multi-page invoices export correctly.
 */
import { CDN } from '../core/config.js';
import { loadScript } from '../utils/qrUtils.js';

const A4 = { w: 210, h: 297 }; // mm

export const ExportService = {
  /**
   * @param {HTMLElement} node  the rendered .invoice-page element
   * @param {string} filename
   */
  async toPdf(node, filename = 'invoice.pdf') {
    await Promise.all([loadScript(CDN.html2canvas), loadScript(CDN.jsPDF)]);
    const { jsPDF } = window.jspdf;

    const canvas = await window.html2canvas(node, {
      scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false,
      windowWidth: node.scrollWidth, windowHeight: node.scrollHeight,
    });

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const img = canvas.toDataURL('image/jpeg', 0.95);
    const fullH = (canvas.height * A4.w) / canvas.width; // height if scaled to full A4 width

    if (fullH <= A4.h * 1.3) {
      // Fits (or slightly over) one page → scale to fit a SINGLE page, centered. This keeps the
      // whole invoice (incl. footer & bank details) together on one page instead of splitting.
      let imgW = A4.w, imgH = fullH;
      if (imgH > A4.h) { imgH = A4.h; imgW = (canvas.width * A4.h) / canvas.height; }
      pdf.addImage(img, 'JPEG', (A4.w - imgW) / 2, 0, imgW, imgH);
    } else {
      // Genuinely long (many items) → paginate across multiple A4 pages.
      let heightLeft = fullH, position = 0;
      pdf.addImage(img, 'JPEG', 0, position, A4.w, fullH);
      heightLeft -= A4.h;
      while (heightLeft > 0) {
        position -= A4.h; pdf.addPage();
        pdf.addImage(img, 'JPEG', 0, position, A4.w, fullH);
        heightLeft -= A4.h;
      }
    }
    pdf.save(filename);
  },

  /** Print just the invoice. Scales the clone to fit one A4 page so the footer/bank details
   *  stay on the same page instead of spilling to a second sheet. */
  print(node) {
    const printRoot = document.getElementById('print-root') || (() => {
      const d = document.createElement('div'); d.id = 'print-root'; document.body.appendChild(d); return d;
    })();
    printRoot.innerHTML = '';
    const clone = node.cloneNode(true);
    clone.setAttribute('contenteditable', 'false');
    clone.classList.remove('is-editing');
    printRoot.appendChild(clone);

    const A4H = 1122.5; // 297mm @ 96dpi
    const h = node.scrollHeight || clone.scrollHeight;
    if (h > A4H) {
      const s = A4H / h;
      clone.style.transformOrigin = 'top center';
      clone.style.transform = `scale(${s})`;
      clone.style.marginBottom = `${-(h - h * s)}px`;
    }

    document.body.classList.add('printing');
    window.print();
    document.body.classList.remove('printing');
    printRoot.innerHTML = '';
  },
};
