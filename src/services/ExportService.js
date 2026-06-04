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
    const imgW = A4.w;
    const imgH = (canvas.height * imgW) / canvas.width;
    const img = canvas.toDataURL('image/jpeg', 0.95);

    let heightLeft = imgH;
    let position = 0;
    pdf.addImage(img, 'JPEG', 0, position, imgW, imgH);
    heightLeft -= A4.h;
    while (heightLeft > 0) {
      position -= A4.h;
      pdf.addPage();
      pdf.addImage(img, 'JPEG', 0, position, imgW, imgH);
      heightLeft -= A4.h;
    }
    pdf.save(filename);
  },

  /** Print just the invoice using the browser print dialog (uses @media print CSS). */
  print(node) {
    const printRoot = document.getElementById('print-root') || (() => {
      const d = document.createElement('div'); d.id = 'print-root'; document.body.appendChild(d); return d;
    })();
    printRoot.innerHTML = '';
    printRoot.appendChild(node.cloneNode(true));
    document.body.classList.add('printing');
    window.print();
    document.body.classList.remove('printing');
    printRoot.innerHTML = '';
  },
};
