/**
 * PreviewPage — live render of the current invoice in the selected template, with
 * Desktop / A4 / Print view toggles and PDF export.
 */
import { h, clear } from '../utils/dom.js';
import { store } from '../core/store.js';
import { TemplateService } from '../services/TemplateService.js';
import { TemplateEngine } from '../templates/engine/TemplateEngine.js';
import { ExportService } from '../services/ExportService.js';
import { getSampleInvoice } from '../utils/sample.js';
import { toast } from '../components/Toast.js';
import { Modal } from '../components/Modal.js';
import { LogoUploader } from '../components/LogoUploader.js';
import { QrInfo } from '../components/QrInfo.js';
import { QrService } from '../services/QrService.js';
import { money } from '../utils/format.js';
import { tafqeet, tafqeetEn } from '../utils/tafqeet.js';

export async function PreviewPage(params = {}) {
  const el = h('div', { class: 'max-w-6xl mx-auto px-4 py-6' });

  const templateId = params.id || store.get('selectedTemplateId') || 'zatca';
  const invoice = store.get('currentInvoice') || await getSampleInvoice();
  const usingSample = !store.get('currentInvoice');

  let template;
  try { template = await TemplateService.get(templateId); }
  catch { template = await TemplateService.get('zatca'); }

  // Draw the QR image from its (preserved) content if we only have content so far.
  await QrService.ensureImage(invoice);

  const stage = h('div', { class: 'preview-stage' });
  let view = 'a4';
  let node = null;        // invoice page (page 1)
  let bankNode = null;    // bank/payment details page (page 2), when present
  let editing = false;

  // Live-recalc totals on any edit while in edit mode. (For a contenteditable root the input
  // event targets the root, not the cell, so we recalc on any input — it just re-reads the item
  // cells; editing non-numeric text leaves totals unchanged.) Coalesced via rAF.
  let recalcQueued = false;
  stage.addEventListener('input', () => {
    if (!editing || recalcQueued) return;
    recalcQueued = true;
    requestAnimationFrame(() => { recalcQueued = false; recalc(); });
  });

  function render() {
    clear(stage);
    node = TemplateEngine.render(invoice, template);
    stage.appendChild(h('div', { class: `preview-frame view-${view}` }, node));
    // Bank/payment details render as a SEPARATE page (page 2) when the user has added them.
    bankNode = TemplateEngine.renderBankPage(invoice, template);
    if (bankNode) stage.appendChild(h('div', { class: `preview-frame view-${view}`, style: { marginTop: '16px' } }, bankNode));
    applyEditing();
  }

  /** All rendered pages (invoice + optional bank page), for export/print. */
  function pages() { return [node, bankNode].filter(Boolean); }

  // Inline WYSIWYG editing: make every text on the invoice editable before print/export.
  // Edits live in the rendered DOM, which is exactly what print()/toPdf() capture.
  function applyEditing() {
    pages().forEach((p) => {
      p.setAttribute('contenteditable', editing ? 'true' : 'false');
      p.classList.toggle('is-editing', editing);
      p.spellcheck = false;
      p.querySelectorAll('img').forEach((im) => { im.setAttribute('contenteditable', 'false'); im.draggable = false; });
      p.querySelectorAll('[data-ro]').forEach((el) => el.setAttribute('contenteditable', 'false'));
    });
  }

  // Parse a displayed number (handles Arabic-Indic digits, commas, %, currency text).
  function parseNum(t) {
    const s = String(t ?? '').replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^\d.\-]/g, '');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  // Recalculate line subtotals + invoice totals in place from the edited item cells.
  // Updates only tagged cells, so all other inline edits are preserved.
  function recalc() {
    if (!node) return;
    const indices = [...new Set([...node.querySelectorAll('[data-item]')].map((e) => e.getAttribute('data-item')))];
    let gross = 0, disc = 0, tax = 0;
    indices.forEach((i) => {
      const cell = (sel) => node.querySelector(`[data-item="${i}"][${sel}]`);
      const qty = parseNum(cell('data-k="qty"')?.textContent);
      const price = parseNum(cell('data-k="unitPrice"')?.textContent);
      const d = parseNum(cell('data-k="discount"')?.textContent);
      const rateCell = cell('data-k="taxRate"');
      const rate = rateCell ? parseNum(rateCell.textContent) / 100 : 0.15;
      const lineGross = qty * price, lineNet = lineGross - d, lineTax = lineNet * rate, lineTotal = lineNet + lineTax;
      gross += lineGross; disc += d; tax += lineTax;
      const setCalc = (k, v) => { const el = node.querySelector(`[data-item="${i}"][data-calc="${k}"]`); if (el) el.textContent = money(v, false); };
      setCalc('subtotal', lineNet); setCalc('subtotalExcl', lineNet);
      setCalc('taxAmount', lineTax); setCalc('subtotalIncl', lineTotal); setCalc('total', lineTotal);
      // keep the model in sync (so export/store reflect edits; original totals no longer apply)
      if (invoice.items[i]) { invoice.items[i].qty = qty; invoice.items[i].unitPrice = price; invoice.items[i].discount = d; }
    });
    const net = gross - disc, grand = net + tax;
    invoice.originalTotals = null;
    const totals = { gross, net, taxable: net, subtotal: net, discount: disc, tax, grand };
    node.querySelectorAll('[data-total]').forEach((el) => {
      const key = el.getAttribute('data-total');
      if (!(key in totals)) return;
      const plain = el.getAttribute('data-money') === 'plain';
      let s = plain ? money(totals[key], false) : money(totals[key]);
      if (el.getAttribute('data-neg') === '1') s = `- ${s}`;
      el.textContent = s;
    });
    node.querySelectorAll('[data-total-words="en"]').forEach((el) => { el.textContent = tafqeetEn(grand); });
    node.querySelectorAll('[data-total-words="ar"]').forEach((el) => { el.textContent = tafqeet(grand); });
  }

  const viewBtn = (label, v) => h('button', { class: 'tab-btn', dataset: { v }, onClick: () => { view = v; sync(); render(); } }, label);
  const viewBar = h('div', { class: 'flex gap-1 bg-slate-100 p-1 rounded-xl w-fit' },
    viewBtn('سطح المكتب', 'desktop'), viewBtn('A4', 'a4'), viewBtn('طباعة', 'print'));
  function sync() { viewBar.querySelectorAll('button').forEach((b) => b.classList.toggle('is-active', b.dataset.v === view)); }

  // Show what's inside the QR (decoded ZATCA TLV fields, or raw content).
  function openQrDialog() {
    Modal({
      title: 'محتوى رمز QR',
      size: 'sm',
      body: QrInfo(invoice.qrContent),
    });
  }

  // Attach / replace the organization logo on the current invoice (works for any source).
  function openLogoDialog() {
    const uploader = LogoUploader({
      initial: invoice.company.logoDataUrl || '',
      onChange: (dataUrl) => {
        invoice.company.logoDataUrl = dataUrl;
        if (!usingSample) store.set('currentInvoice', invoice); // persist live for real invoices
        render();
      },
    });
    Modal({
      title: 'شعار المنشأة',
      size: 'sm',
      body: h('div', { class: 'space-y-3' },
        h('p', { class: 'text-sm text-slate-500' }, 'ارفع شعار منشأتك ليظهر في ترويسة الفاتورة. يظهر التغيير فوراً في المعاينة.'),
        uploader,
      ),
    });
  }

  // Add/edit bank payment details — these render on a SEPARATE page (page 2). Empty = no page.
  function openBankDialog() {
    const co = invoice.company;
    const field = (label, key) => h('label', { class: 'block' },
      h('span', { class: 'block text-xs font-semibold text-slate-500 mb-1' }, label),
      h('input', { name: key, value: co[key] || '', class: 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 outline-none' }));
    const body = h('div', { class: 'space-y-3' },
      h('p', { class: 'text-sm text-slate-500' }, 'أضف تفاصيل الدفع البنكية — ستظهر في صفحة منفصلة (صفحة 2) عند التصدير/الطباعة. اتركها فارغة لإلغاء الصفحة.'),
      h('div', { class: 'grid grid-cols-1 sm:grid-cols-2 gap-3' },
        field('اسم المستفيد', 'payeeName'),
        field('رقم الحساب', 'accountNumber'),
        field('المصرف', 'bankName'),
        field('الفرع', 'bankBranch'),
        field('رقم الآيبان (IBAN)', 'iban'),
        field('رقم السويفت (SWIFT)', 'swift'),
      ),
    );
    const m = Modal({
      title: '🏦 تفاصيل الدفع البنكية', size: 'lg', body,
      actions: [
        h('button', { class: 'btn-primary', onClick: () => {
          ['payeeName', 'accountNumber', 'bankName', 'bankBranch', 'iban', 'swift']
            .forEach((k) => { co[k] = body.querySelector(`[name="${k}"]`).value.trim(); });
          if (!usingSample) store.set('currentInvoice', invoice);
          render();
          toast(TemplateEngine.hasBankPage(invoice) ? 'تمت إضافة صفحة تفاصيل الدفع' : 'تم حذف تفاصيل الدفع', 'success');
          m.close();
        } }, 'حفظ'),
        h('button', { class: 'btn-secondary', onClick: () => m.close() }, 'إلغاء'),
      ],
    });
  }

  // Letterhead ("ورق مروّس"): issue the invoice on the company's official paper.
  function openLetterheadDialog() {
    const lh = invoice.letterhead;
    const previewImg = h('img', { class: 'h-28 w-auto max-w-[200px] object-contain border border-slate-200 rounded bg-white', src: lh.imageDataUrl || '', style: { display: lh.imageDataUrl ? 'block' : 'none' } });
    const fileInput = h('input', { type: 'file', accept: 'image/png,image/jpeg', class: 'hidden', onChange: (e) => {
      const f = e.target.files[0]; if (!f) return; const r = new FileReader();
      r.onload = () => { lh.imageDataUrl = r.result; previewImg.src = r.result; previewImg.style.display = 'block'; }; r.readAsDataURL(f); e.target.value = '';
    } });
    const enabled = h('input', { type: 'checkbox', checked: lh.enabled, class: 'w-4 h-4' });
    const hideHF = h('input', { type: 'checkbox', checked: lh.hideHeaderFooter, class: 'w-4 h-4' });
    const modeEmbed = h('input', { type: 'radio', name: 'lhmode', checked: lh.showBackground, class: 'w-4 h-4' });
    const modePre = h('input', { type: 'radio', name: 'lhmode', checked: !lh.showBackground, class: 'w-4 h-4' });
    const mInput = (v) => h('input', { type: 'number', value: v, min: '0', max: '100', class: 'w-20 border border-slate-200 rounded-lg px-2 py-1 text-sm' });
    const mTop = mInput(lh.margins.top), mBottom = mInput(lh.margins.bottom), mSide = mInput(lh.margins.side);
    const cbRow = (input, label, hint) => h('label', { class: 'flex items-start gap-2 cursor-pointer' }, input,
      h('span', {}, h('span', { class: 'text-sm font-medium text-slate-700' }, label), hint ? h('span', { class: 'block text-xs text-slate-400' }, hint) : null));

    const body = h('div', { class: 'space-y-4' },
      cbRow(enabled, 'تفعيل الورق المروّس', 'إصدار الفاتورة وصفحة البنك على ورق المؤسسة الرسمي'),
      h('div', { class: 'flex items-center gap-3' },
        previewImg,
        h('button', { class: 'btn-secondary', onClick: () => fileInput.click() }, lh.imageDataUrl ? 'تغيير صورة الترويسة' : 'رفع صورة الترويسة (A4)'), fileInput,
      ),
      h('div', { class: 'border-t border-slate-100 pt-3 space-y-2' },
        h('div', { class: 'text-sm font-bold text-slate-700' }, 'طريقة الإخراج'),
        cbRow(modeEmbed, 'ترويسة رقمية مدمجة', 'تظهر صورة الترويسة داخل PDF (للإرسال أو الطباعة على ورق أبيض)'),
        cbRow(modePre, 'ورق مطبوع مسبقاً', 'الطباعة على ورقك المروّس الفعلي — هوامش فقط بلا خلفية'),
      ),
      cbRow(hideHF, 'إخفاء رأس/تذييل الفاتورة', 'موصى به — لتجنّب تكرار الشعار والعنوان الموجودين على الورق'),
      h('div', { class: 'border-t border-slate-100 pt-3' },
        h('div', { class: 'text-sm font-bold text-slate-700 mb-2' }, 'الهوامش الآمنة (مم)'),
        h('div', { class: 'flex flex-wrap gap-4' },
          h('label', { class: 'flex items-center gap-2 text-sm' }, 'أعلى', mTop),
          h('label', { class: 'flex items-center gap-2 text-sm' }, 'أسفل', mBottom),
          h('label', { class: 'flex items-center gap-2 text-sm' }, 'الجانبان', mSide),
        ),
      ),
    );
    const m = Modal({
      title: '🧾 ورق مروّس (ترويسة المؤسسة)', size: 'lg', body,
      actions: [
        h('button', { class: 'btn-primary', onClick: () => {
          lh.enabled = enabled.checked;
          lh.showBackground = modeEmbed.checked;
          lh.hideHeaderFooter = hideHF.checked;
          lh.margins = { top: +mTop.value || 0, bottom: +mBottom.value || 0, side: +mSide.value || 0 };
          if (lh.enabled && lh.showBackground && !lh.imageDataUrl) { toast('ارفع صورة الترويسة أولاً، أو اختر «ورق مطبوع مسبقاً»', 'warn'); return; }
          if (!usingSample) store.set('currentInvoice', invoice);
          render();
          toast(lh.enabled ? 'تم تفعيل الورق المروّس' : 'تم إلغاء الورق المروّس', 'success');
          m.close();
        } }, 'حفظ'),
        h('button', { class: 'btn-secondary', onClick: () => m.close() }, 'إلغاء'),
      ],
    });
  }

  el.append(
    h('div', { class: 'flex flex-wrap items-center justify-between gap-3 mb-4' },
      h('div', {},
        h('h1', { class: 'text-xl font-extrabold text-slate-800' }, `المعاينة — ${template.name}`),
        usingSample ? h('p', { class: 'text-amber-600 text-xs' }, 'تُعرض بيانات تجريبية. انتقل إلى "إدخال فاتورة" لاستخدام بياناتك.') : null,
      ),
      h('div', { class: 'flex flex-wrap items-center gap-2 w-full sm:w-auto' },
        viewBar,
        h('button', { class: 'btn-secondary', onClick: () => location.hash = '#/gallery' }, 'تغيير القالب'),
        h('button', { class: 'btn-secondary', onClick: openLogoDialog }, '🖼️ الشعار'),
        h('button', { class: 'btn-secondary', dataset: { role: 'edit' }, onClick: (e) => {
          editing = !editing; applyEditing();
          e.currentTarget.classList.toggle('is-active', editing);
          e.currentTarget.textContent = editing ? '🔒 إنهاء التعديل' : '✏️ تعديل';
          if (editing) toast('وضع التعديل مفعّل — انقر أي نص على الفاتورة لتعديله', 'info');
        } }, '✏️ تعديل'),
        h('button', { class: 'btn-secondary', onClick: openQrDialog }, '🔎 محتوى QR'),
        h('button', { class: 'btn-secondary', onClick: openBankDialog }, '🏦 تفاصيل البنك'),
        h('button', { class: 'btn-secondary', onClick: openLetterheadDialog }, '🧾 ورق مروّس'),
        h('button', { class: 'btn-secondary', onClick: () => ExportService.print(pages()) }, '🖨️ طباعة'),
        h('button', { class: 'btn-primary', onClick: async () => {
          toast('جارٍ إنشاء PDF…'); try { await ExportService.toPdf(pages(), `${invoice.invoiceNumber || 'invoice'}.pdf`); toast('تم تنزيل PDF', 'success'); }
          catch (e) { toast('تعذر التصدير: ' + e.message, 'error'); }
        } }, '⬇️ تنزيل PDF'),
      ),
    ),
    stage,
  );

  sync(); render();
  return { el };
}
