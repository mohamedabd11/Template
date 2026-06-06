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
  async toPdf(nodes, filename = 'invoice.pdf') {
    await Promise.all([loadScript(CDN.html2canvas), loadScript(CDN.jsPDF)]);
    const { jsPDF } = window.jspdf;
    const list = (Array.isArray(nodes) ? nodes : [nodes]).filter(Boolean);
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

    let first = true;
    for (const node of list) {
      const canvas = await window.html2canvas(node, {
        scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false,
        windowWidth: node.scrollWidth, windowHeight: node.scrollHeight,
      });
      const img = canvas.toDataURL('image/jpeg', 0.95);
      const fullH = (canvas.height * A4.w) / canvas.width;
      if (!first) pdf.addPage();
      first = false;

      if (fullH <= A4.h * 1.3) {
        // Fit each page (invoice / bank) onto a single A4 page, centered.
        let imgW = A4.w, imgH = fullH;
        if (imgH > A4.h) { imgH = A4.h; imgW = (canvas.width * A4.h) / canvas.height; }
        pdf.addImage(img, 'JPEG', (A4.w - imgW) / 2, 0, imgW, imgH);
      } else {
        // Genuinely long (many items) → paginate this node across multiple A4 pages.
        let heightLeft = fullH, position = 0;
        pdf.addImage(img, 'JPEG', 0, position, A4.w, fullH);
        heightLeft -= A4.h;
        while (heightLeft > 0) {
          position -= A4.h; pdf.addPage();
          pdf.addImage(img, 'JPEG', 0, position, A4.w, fullH);
          heightLeft -= A4.h;
        }
      }
    }
    pdf.save(filename);
  },

  /** Print just the invoice. Scales the clone to fit one A4 page so the footer/bank details
   *  stay on the same page instead of spilling to a second sheet. */
  print(nodes) {
    const list = (Array.isArray(nodes) ? nodes : [nodes]).filter(Boolean);
    const printRoot = document.getElementById('print-root') || (() => {
      const d = document.createElement('div'); d.id = 'print-root'; document.body.appendChild(d); return d;
    })();
    printRoot.innerHTML = '';
    const A4H = 1122.5; // 297mm @ 96dpi
    list.forEach((node, i) => {
      const clone = node.cloneNode(true);
      clone.setAttribute('contenteditable', 'false');
      clone.classList.remove('is-editing');
      if (i > 0) clone.style.pageBreakBefore = 'always';
      const h = node.scrollHeight || clone.scrollHeight;
      if (h > A4H) {
        const s = A4H / h;
        clone.style.transformOrigin = 'top center';
        clone.style.transform = `scale(${s})`;
        clone.style.marginBottom = `${-(h - h * s)}px`;
      }
      printRoot.appendChild(clone);
    });

    document.body.classList.add('printing');
    window.print();
    document.body.classList.remove('printing');
    printRoot.innerHTML = '';
  },
};
