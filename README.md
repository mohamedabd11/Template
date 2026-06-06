# Invoice Template Studio — استوديو قوالب الفواتير

منصة ويب لإعادة تصميم الفواتير الصادرة من أي نظام ERP أو برنامج محاسبي وتحويلها إلى **قوالب احترافية**
بنمط الأعمال السعودي (RTL، عربي أولاً، A4) — **دون تعديل بيانات الفاتورة الأصلية**.

> الهدف: إعادة تصميم الفواتير، وليس إصدار فواتير إلكترونية جديدة.

النسخة الأولى تعمل بالكامل كموقع **ثابت (Static)** على **GitHub Pages**، مع بنية معمارية تسمح بالانتقال
مستقبلاً إلى Next.js + PostgreSQL/Supabase/Firebase/API و SaaS متعدد المستأجرين.

---

## ✨ الميزات

- **مكتبة 21 قالباً احترافياً** موزعة على 7 فئات (Corporate / Modern / Executive / Construction /
  Transport / Travel Agency / Retail). كل قالب مختلف فعلياً في: تخطيط الترويسة، ألوان الهوية، مكان
  بيانات العميل، شكل الجدول، عرض الإجماليات، تصميم QR، وشكل التذييل.
- **معرض Marketplace**: بحث، تصنيف، مفضلة، معاينة كاملة، اختيار، نسخ، تخصيص — مع **معاينات حية مصغرة**.
- **محرك قوالب (Template Engine)** قائم على variants قابلة لإعادة الاستخدام — إضافة قالب جديد = مجلد جديد
  بدون تعديل الكود.
- **4 طرق إدخال**: يدوي · استيراد PDF (pdf.js) · رفع صورة + OCR (Tesseract.js) · استيراد JSON (لـ ERP).
- **إدارة QR** بأربع طرق: رفع صورة جاهزة · قراءة من صورة · قراءة من PDF · إعادة الرسم من المحتوى —
  مع **الحفاظ على محتوى QR الأصلي** (لا يُنشأ رمز جديد إلا بطلب المستخدم).
- **مصمم القوالب (Designer)**: ألوان، خطوط، شعار، حدود، وتبديل تخطيط العناصر مع معاينة فورية.
- **معاينة حية** بثلاثة أوضاع: سطح المكتب / A4 / طباعة.
- **تصدير PDF** عالي الجودة (A4، RTL، عربي) + طباعة.
- **تطبيق PWA** قابل للتثبيت على أندرويد / آيفون / كمبيوتر، ويعمل دون اتصال (Service Worker).

---

## 🏗️ المعمارية (فصل الطبقات)

```
UI (components + pages)  →  Business Logic (services)  →  Data Layer (storage)  →  Template Engine
```

- **UI**: `src/components`, `src/pages` — عرض فقط، لا منطق أعمال.
- **Business Logic**: `src/services` — `ImportService`, `PdfImportService`, `OcrService`, `QrService`,
  `ExportService`, `TemplateService`, `ValidationService`.
- **Data Layer (Repository Pattern)**: `src/storage` — `StorageAdapter` (عقد) + `LocalStorageAdapter`
  (التنفيذ الحالي) + repositories. استبدال التخزين لاحقاً لا يتطلب تغيير الـ repositories.
- **Models جاهزة لقاعدة البيانات**: `src/models` — `Invoice`, `InvoiceItem`, `Template`, `Company`,
  `Customer`.
- **Template Engine**: `src/templates/engine` — يحوّل (فاتورة + قالب) إلى صفحة A4، عبر **block variants**.

تعليقات `ROADMAP` داخل الكود توضّح نقاط ربط PostgreSQL / Supabase / Firebase / API مستقبلاً
(ابدأ من `src/storage/StorageAdapter.js` و `src/core/config.js`).

### هيكل المشروع

```
index.html · manifest.webmanifest · sw.js · .nojekyll
assets/            (css, icons, fonts, sample-invoice.json)
scripts/           (مولّدات القوالب والأيقونات — للمساهمين)
src/
  core/            Router · EventBus · store · config
  models/          Invoice · InvoiceItem · Template · Company · Customer
  storage/         StorageAdapter · LocalStorageAdapter · *Repository
  services/        Import · Pdf · Ocr · Qr · Export · Template · Validation
  templates/
    engine/        TemplateEngine + blocks/{header,customer,table,totals,qr,footer}
    templates.index.json
    <template-id>/ template.json + template.css        (×21)
  components/       Navbar · TemplateCard · Modal · Toast · FileDrop · InvoiceForm · ReviewPanel · QrPanel · Spinner
  pages/           Gallery · Import · Preview · Designer
  utils/           dom · format · arabic · tafqeet · qrUtils · sample
  main.js
```

---

## 🚀 التشغيل محلياً

المشروع بلا خطوة build (Vanilla ES Modules + Tailwind Play CDN). شغّل أي خادم ثابت:

```bash
# أحد الخيارات:
npx http-server -p 8000 -c-1
python3 -m http.server 8000
```

ثم افتح `http://localhost:8000`.

> ملاحظة: يجب تقديم الملفات عبر `http://` وليس فتح `index.html` مباشرة بـ `file://` (بسبب ES Modules
> و fetch للقوالب). بعض المكتبات (Tailwind، pdf.js، Tesseract، fonts) تُحمَّل من CDN فتحتاج اتصالاً
> بالإنترنت لأول تحميل، ثم يخزّنها Service Worker للعمل دون اتصال.

---

## ☁️ النشر على GitHub Pages

1. ادفع الكود إلى المستودع.
2. Settings → Pages → Source: اختر الفرع و **/ (root)**.
3. الملف `.nojekyll` موجود مسبقاً ليُقدّم مجلد `/src` والملفات بشكل صحيح.
4. التطبيق يستخدم **توجيه عبر الهاش** (`#/gallery`) ليعمل على GitHub Pages بدون إعدادات خادم.

---

## ➕ إضافة قالب جديد (بدون تعديل الكود)

1. أنشئ مجلداً: `src/templates/<my-template-id>/`.
2. أضف `template.json`:
   ```json
   {
     "id": "my-template-id",
     "name": "اسم القالب",
     "nameEn": "My Template",
     "category": "Corporate",
     "tags": ["custom"],
     "builtin": true,
     "theme": { "primary": "#1e3a8a", "accent": "#3b82f6", "text": "#0f172a", "muted": "#64748b", "bg": "#ffffff", "line": "#e2e8f0" },
     "fonts": { "base": "Tajawal", "heading": "Cairo" },
     "layout": {
       "header":   { "variant": "band" },
       "customer": { "variant": "card" },
       "table":    { "variant": "striped" },
       "totals":   { "variant": "boxed-right" },
       "qr":       { "variant": "framed" },
       "footer":   { "variant": "bar" }
     }
   }
   ```
3. أضف `template.css` (هوية بصرية إضافية، مُحدَّدة النطاق بـ `.tpl-<id>`).
4. سجّل القالب في `src/templates/templates.index.json` ضمن مصفوفة `templates`.

**variants المتاحة** (من محرك القوالب):
- header: `band, split, centered, stacked, sidebar, hero, darkbar, ribbon, blueprint, minimal-line`
- customer: `card, two-col, inline-strip, boxed, labeled-rows`
- table: `striped, grid, minimal-lines, dark-header, pill, blueprint, boarding-pass`
- totals: `boxed-right, stacked-card, highlight-bar, ledger, gold-frame`
- qr: `framed, plain, circle-badge, corner, captioned`
- footer: `bar, centered-note, signature-stamp, blueprint-strip, gradient`

> المولّدات في `scripts/` (`generate-templates.mjs`، `generate-icons.mjs`) تساعد على توليد القوالب
> والأيقونات بشكل متّسق: `node scripts/generate-templates.mjs`.

---

## 🧩 صيغة JSON للتكامل مع ERP

```json
{
  "invoiceNumber": "INV-001",
  "date": "2026-06-01",
  "customer": "اسم العميل",
  "items": [{ "description": "بند", "qty": 1, "unitPrice": 100, "taxRate": 0.15 }]
}
```
انظر `assets/sample-invoice.json` لمثال كامل (مع شركة، عميل، وإجماليات أصلية ومحتوى QR).

---

## 🗺️ خارطة الطريق

- استبدال `LocalStorageAdapter` بمحوّل قاعدة بيانات (PostgreSQL / Supabase / Firebase / REST).
- مصادقة المستخدمين و SaaS متعدد المستأجرين (`config.TENANT_ID`).
- الترحيل إلى Next.js (البنية الحالية React-portable عمداً).
- تحسين استخراج البنود من PDF/الصور.

---

## 🛡️ ملاحظة على الخصوصية

كل المعالجة (PDF، OCR، QR، تصدير PDF) تتم **داخل المتصفح** بالكامل في النسخة الحالية — لا تُرفع بياناتك
إلى أي خادم.
