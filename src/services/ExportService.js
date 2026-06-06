/**
 * ExportService — produce the invoice as PDF/print using the BROWSER'S OWN print engine.
 *
 * We deliberately do NOT rasterize with html2canvas: it can't render CSS Grid (and several
 * other modern features) the detailed ZATCA layout relies on, which produced a broken PDF.
 * The browser print pipeline renders the exact same layout as the preview (grid/flex/RTL/
 * fonts), so "save as PDF" matches the screen perfectly. Multi-page (invoice + bank) is
 * supported; each page is scaled to fit one A4 sheet so nothing splits.
 */

const A4H = 1122.5; // 297mm @ 96dpi

/** Clean, unscaled clone of a page for printing. */
function cleanClone(node) {
  const clone = node.cloneNode(true);
  clone.setAttribute('contenteditable', 'false');
  clone.classList.remove('is-editing');
  clone.style.transform = 'none';
  clone.style.margin = '0';
  clone.style.boxShadow = 'none';
  return clone;
}

function runPrint(list, title) {
  const printRoot = document.getElementById('print-root') || (() => {
    const d = document.createElement('div'); d.id = 'print-root'; document.body.appendChild(d); return d;
  })();
  printRoot.innerHTML = '';
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

  const prevTitle = document.title;
  if (title) document.title = title; // suggests the saved-PDF filename

  const cleanup = () => {
    document.body.classList.remove('printing');
    printRoot.innerHTML = '';
    document.title = prevTitle;
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  document.body.classList.add('printing');
  window.print();
  setTimeout(() => { if (document.body.classList.contains('printing')) cleanup(); }, 30000);
}

export const ExportService = {
  /** Open the print dialog (user can pick a printer or "Save as PDF"). */
  print(nodes) {
    runPrint((Array.isArray(nodes) ? nodes : [nodes]).filter(Boolean));
  },

  /**
   * "Download PDF" — uses the browser print pipeline so the result is identical to the preview.
   * The user chooses "Save as PDF" in the dialog; `filename` seeds the suggested name.
   */
  async toPdf(nodes, filename = 'invoice.pdf') {
    runPrint((Array.isArray(nodes) ? nodes : [nodes]).filter(Boolean), filename.replace(/\.pdf$/i, ''));
  },
};
