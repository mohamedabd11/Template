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

export async function PreviewPage(params = {}) {
  const el = h('div', { class: 'max-w-6xl mx-auto px-4 py-6' });

  const templateId = params.id || store.get('selectedTemplateId') || 'corporate-blue';
  const invoice = store.get('currentInvoice') || await getSampleInvoice();
  const usingSample = !store.get('currentInvoice');

  let template;
  try { template = await TemplateService.get(templateId); }
  catch { template = await TemplateService.get('corporate-blue'); }

  // Draw the QR image from its (preserved) content if we only have content so far.
  await QrService.ensureImage(invoice);

  const stage = h('div', { class: 'preview-stage' });
  let view = 'a4';
  let node = null;

  function render() {
    clear(stage);
    node = TemplateEngine.render(invoice, template);
    const wrap = h('div', { class: `preview-frame view-${view}` }, node);
    stage.appendChild(wrap);
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

  el.append(
    h('div', { class: 'flex flex-wrap items-center justify-between gap-3 mb-4' },
      h('div', {},
        h('h1', { class: 'text-xl font-extrabold text-slate-800' }, `المعاينة — ${template.name}`),
        usingSample ? h('p', { class: 'text-amber-600 text-xs' }, 'تُعرض بيانات تجريبية. انتقل إلى "إدخال فاتورة" لاستخدام بياناتك.') : null,
      ),
      h('div', { class: 'flex items-center gap-2' },
        viewBar,
        h('button', { class: 'btn-secondary', onClick: () => location.hash = '#/gallery' }, 'تغيير القالب'),
        h('button', { class: 'btn-secondary', onClick: openLogoDialog }, '🖼️ الشعار'),
        h('button', { class: 'btn-secondary', onClick: openQrDialog }, '🔎 محتوى QR'),
        h('button', { class: 'btn-secondary', onClick: () => ExportService.print(node) }, '🖨️ طباعة'),
        h('button', { class: 'btn-primary', onClick: async () => {
          toast('جارٍ إنشاء PDF…'); try { await ExportService.toPdf(node, `${invoice.invoiceNumber || 'invoice'}.pdf`); toast('تم تنزيل PDF', 'success'); }
          catch (e) { toast('تعذر التصدير: ' + e.message, 'error'); }
        } }, '⬇️ تنزيل PDF'),
      ),
    ),
    stage,
  );

  sync(); render();
  return { el };
}
