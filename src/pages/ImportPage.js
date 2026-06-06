/**
 * ImportPage — 4 input methods (manual / PDF / image / JSON) + QR panel. Builds the current
 * Invoice in the store, then routes to preview.
 */
import { h, clear } from '../utils/dom.js';
import { ImportService } from '../services/ImportService.js';
import { store } from '../core/store.js';
import { InvoiceForm } from '../components/InvoiceForm.js';
import { QrPanel } from '../components/QrPanel.js';
import { FileDrop } from '../components/FileDrop.js';
import { Spinner } from '../components/Spinner.js';
import { toast } from '../components/Toast.js';

export async function ImportPage() {
  const el = h('div', { class: 'max-w-5xl mx-auto px-4 py-6' });
  let pdfFile = null;
  let prefill = null; // payload extracted from PDF/OCR, loaded into the manual form for review
  let prefillNote = null; // 'extracted' | 'noxml'

  const tabs = ['يدوي', 'استيراد PDF', 'رفع صورة', 'استيراد JSON', 'استيراد XML'];
  let active = 0;
  const tabBar = h('div', { class: 'flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-5' });
  const panel = h('div', {});

  function setTab(i) { active = i; tabBar.querySelectorAll('button').forEach((b, idx) => b.classList.toggle('is-active', idx === i)); renderPanel(); }
  tabs.forEach((t, i) => tabBar.appendChild(h('button', { class: 'tab-btn', onClick: () => setTab(i) }, t)));

  function finish(invoice, qr) {
    if (qr?.content) invoice.qrContent = qr.content;
    if (qr?.imageDataUrl) invoice.qrImageDataUrl = qr.imageDataUrl;
    // also pull any QR set into the store via QrPanel
    invoice.qrContent = invoice.qrContent || store.get('qrContent');
    invoice.qrImageDataUrl = invoice.qrImageDataUrl || store.get('qrImageDataUrl');
    store.set('currentInvoice', invoice);
    toast('تم تجهيز الفاتورة', 'success');
    location.hash = '#/preview';
  }

  function renderPanel() {
    clear(panel);

    if (active === 0) {
      const initial = prefill || store.get('currentInvoice')?.toJSON() || {};
      const form = InvoiceForm(initial);
      const itemCount = (initial.items || []).length;
      const banner = prefillNote ? h('div', { class: 'bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-sm mb-4' },
        h('div', { class: 'font-bold mb-1' }, prefillNote === 'noxml'
          ? '⚠️ استخراج تقريبي من النص (الملف لا يحتوي XML)'
          : '✅ تم استخراج البيانات من الصورة — راجعها قبل المتابعة'),
        h('div', { class: 'text-xs leading-relaxed' },
          `عُبّئت الحقول والبنود المكتشفة (${itemCount} بند). راجع وعدّل أي قيمة (خصوصاً البنود والإجماليات) ثم تابع. للاستخراج الكامل الدقيق استخدم «استيراد XML» إن توفّر الملف الأصلي.`),
      ) : null;
      panel.append(banner, form, h('div', { class: 'mt-4 flex gap-2' },
        h('button', { class: 'btn-primary', onClick: () => {
          const inv = ImportService.fromManual(form.read());
          const v = inv.validate(); if (!v.valid) { toast(v.errors[0], 'error'); return; }
          finish(inv);
        } }, 'متابعة إلى المعاينة'),
      ));
    }

    if (active === 1) {
      const out = h('div', { class: 'mt-4' });
      panel.append(
        FileDrop({ accept: 'application/pdf', label: 'اسحب ملف PDF للفاتورة أو انقر للاختيار', hint: 'فواتير ZATCA: يُستخرج XML المدمج كاملاً. غير ذلك: استخراج تقريبي للمراجعة', onFile: async (f) => {
          pdfFile = f; clear(out); out.appendChild(Spinner('جارٍ قراءة ملف PDF…'));
          try {
            const res = await ImportService.fromPdf(f);
            if (res.mode === 'ubl') {
              // Complete, exact data from embedded ZATCA XML — build the invoice directly.
              const inv = ImportService.buildFromReviewed(res.payload, 'pdf');
              clear(out);
              out.appendChild(h('div', { class: 'text-emerald-600 text-sm font-semibold mb-3' },
                `✅ تم استخراج الفاتورة كاملة من XML المدمج (${res.items.length} بند). يمكنك المتابعة للمعاينة.`));
              out.appendChild(h('button', { class: 'btn-primary', onClick: () => finish(inv) }, 'متابعة إلى المعاينة'));
            } else {
              loadExtracted(res.payload, 'noxml');
            }
          } catch (e) { clear(out); out.appendChild(h('div', { class: 'text-rose-500 text-sm' }, 'تعذر قراءة الملف: ' + e.message)); }
        } }),
        out,
      );
    }

    if (active === 2) {
      const out = h('div', { class: 'mt-4' });
      panel.append(
        FileDrop({ accept: 'image/png,image/jpeg', label: 'اسحب صورة الفاتورة (PNG/JPG) أو انقر للاختيار', hint: 'سيتم استخدام OCR لاستخراج البيانات ثم مراجعتها', onFile: async (f) => {
          clear(out); const sp = Spinner('جارٍ تشغيل OCR… قد يستغرق لحظات'); out.appendChild(sp);
          try { const res = await ImportService.fromImage(f, (p) => { sp.lastChild.textContent = `جارٍ التعرف… ${Math.round(p * 100)}%`; }); loadExtracted(res.payload, 'extracted'); }
          catch (e) { clear(out); out.appendChild(h('div', { class: 'text-rose-500 text-sm' }, 'تعذر المعالجة: ' + e.message)); }
        } }),
        out,
      );
    }

    if (active === 3) {
      const ta = h('textarea', { class: 'w-full border border-slate-200 rounded-xl p-3 font-mono text-xs', rows: 12, placeholder: '{\n  "invoiceNumber": "INV-001",\n  "date": "2026-06-01",\n  "customer": "اسم العميل",\n  "items": [{ "description": "بند", "qty": 1, "unitPrice": 100 }]\n}' });
      panel.append(
        h('p', { class: 'text-sm text-slate-500 mb-2' }, 'الصق بيانات الفاتورة بصيغة JSON (تهيئة للتكامل مع أنظمة ERP):'),
        ta,
        h('div', { class: 'mt-3 flex gap-2' },
          h('button', { class: 'btn-secondary', onClick: async () => { ta.value = await fetch(new URL('../../assets/sample-invoice.json', import.meta.url)).then((r) => r.text()); } }, 'تحميل مثال'),
          h('button', { class: 'btn-primary', onClick: () => {
            let res; try { res = ImportService.fromJson(ta.value); } catch (e) { toast('JSON غير صالح: ' + e.message, 'error'); return; }
            if (!res.ok) { toast(res.errors[0], 'error'); return; }
            finish(res.invoice);
          } }, 'استيراد ومعاينة'),
        ),
      );
    }

    if (active === 4) {
      const out = h('div', { class: 'mt-4' });
      panel.append(
        h('p', { class: 'text-sm text-slate-500 mb-2' }, 'ارفع ملف فاتورة إلكترونية بصيغة XML (معيار ZATCA / UBL). سيتم استخراج كل البيانات كاملةً.'),
        FileDrop({ accept: '.xml,text/xml,application/xml', label: 'اسحب ملف XML أو انقر للاختيار', hint: 'فاتورة ZATCA/UBL الرسمية — استخراج كامل ودقيق', onFile: async (f) => {
          clear(out); out.appendChild(Spinner('جارٍ قراءة ملف XML…'));
          try {
            const res = await ImportService.fromXml(f);
            clear(out);
            if (!res.ok) { out.appendChild(h('div', { class: 'text-rose-500 text-sm' }, res.errors[0])); return; }
            const inv = ImportService.buildFromReviewed(res.payload, 'xml');
            out.appendChild(h('div', { class: 'text-emerald-600 text-sm font-semibold mb-3' },
              `✅ تم استخراج الفاتورة كاملة من XML (${res.items.length} بند). يمكنك المتابعة للمعاينة.`));
            out.appendChild(h('button', { class: 'btn-primary', onClick: () => finish(inv) }, 'متابعة إلى المعاينة'));
          } catch (e) { clear(out); out.appendChild(h('div', { class: 'text-rose-500 text-sm' }, 'تعذر قراءة الملف: ' + e.message)); }
        } }),
        out,
      );
    }
  }

  /** Load an extracted payload into the manual form (tab 0) for full review/editing. */
  function loadExtracted(payload, note) {
    prefill = payload;
    prefillNote = note;
    toast('تم استخراج البيانات — راجعها في النموذج', 'success');
    setTab(0);
  }

  el.append(
    h('h1', { class: 'text-2xl font-extrabold text-slate-800' }, 'إدخال / استيراد فاتورة'),
    h('p', { class: 'text-slate-500 text-sm mb-5' }, 'أدخل الفاتورة يدوياً أو استوردها من PDF أو صورة أو JSON أو XML. لن يتم تعديل بياناتك الأصلية.'),
    tabBar, panel,
    h('div', { class: 'mt-6' }, QrPanel({ getPdfFile: () => pdfFile })),
  );
  setTab(0);
  return { el };
}
