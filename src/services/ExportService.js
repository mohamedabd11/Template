/**
 * ExportService — A4 PDF export (RTL/Arabic) via html2canvas + jsPDF, plus native print.
 *
 * Both paths render an OFF-SCREEN, full-size, clean clone of each page (not the on-screen
 * preview, which may be scaled by `transform` on mobile or carry edit-mode attributes). This
 * guarantees the export captures only the invoice — at full A4 width — never the app UI, and
 * never a clipped/blank canvas.
 */
import { CDN } from '../core/config.js';
import { loadScript } from '../utils/qrUtils.js';

const A4 = { w: 210, h: 297 }; // mm

/** Prepare a clean, unscaled clone of a page for capture/print. */
function cleanClone(node) {
  const clone = node.cloneNode(true);
  clone.setAttribute('contenteditable', 'false');
  clone.classList.remove('is-editing');
  clone.style.transform = 'none';
  clone.style.margin = '0';
  clone.style.boxShadow = 'none';
  return clone;
}

export const ExportService = {
  /**
   * @param {HTMLElement|HTMLElement[]} nodes  one or more `.invoice-page` elements
   * @param {string} filename
   */
  async toPdf(nodes, filename = 'invoice.pdf') {
    await Promise.all([loadScript(CDN.html2canvas), loadScript(CDN.jsPDF)]);
    const { jsPDF } = window.jspdf;
    const list = (Array.isArray(nodes) ? nodes : [nodes]).filter(Boolean);

    // Off-screen sandbox at full A4 width so capture is crisp and independent of preview scale.
    const sandbox = document.createElement('div');
    sandbox.style.cssText = 'position:fixed; left:-10000px; top:0; width:210mm; background:#fff; z-index:-1;';
    document.body.appendChild(sandbox);

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    let first = true;
    try {
      for (const node of list) {
        const clone = cleanClone(node);
        sandbox.innerHTML = '';
        sandbox.appendChild(clone);
        await new Promise((r) => setTimeout(r, 40)); // let layout/fonts settle

        const canvas = await window.html2canvas(clone, {
          scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false,
          width: clone.offsetWidth, height: clone.offsetHeight,
          windowWidth: clone.offsetWidth, windowHeight: clone.offsetHeight,
        });
        const img = canvas.toDataURL('image/jpeg', 0.95);
        const fullH = (canvas.height * A4.w) / canvas.width;
        if (!first) pdf.addPage();
        first = false;

        if (fullH <= A4.h * 1.3) {
          let imgW = A4.w, imgH = fullH;
          if (imgH > A4.h) { imgH = A4.h; imgW = (canvas.width * A4.h) / canvas.height; }
          pdf.addImage(img, 'JPEG', (A4.w - imgW) / 2, 0, imgW, imgH);
        } else {
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
    } finally {
      sandbox.remove();
    }
    pdf.save(filename);
  },

  /** Print just the invoice (+ bank page). Scales each clone to fit one A4 page. */
  print(nodes) {
    const list = (Array.isArray(nodes) ? nodes : [nodes]).filter(Boolean);
    const printRoot = document.getElementById('print-root') || (() => {
      const d = document.createElement('div'); d.id = 'print-root'; document.body.appendChild(d); return d;
    })();
    printRoot.innerHTML = '';
    const A4H = 1122.5; // 297mm @ 96dpi
    list.forEach((node, i) => {
      const clone = cleanClone(node);
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

    // Keep app hidden until printing finishes. On mobile window.print() is async, so cleanup
    // must wait for afterprint (removing the class immediately would print the whole app).
    const cleanup = () => {
      document.body.classList.remove('printing');
      printRoot.innerHTML = '';
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    document.body.classList.add('printing');
    window.print();
    // Fallback in case afterprint never fires.
    setTimeout(() => { if (document.body.classList.contains('printing')) cleanup(); }, 30000);
  },
};
