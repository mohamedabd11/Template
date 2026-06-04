/**
 * Global application configuration & constants.
 *
 * ROADMAP (backend migration):
 *  - `API_BASE_URL` and `TENANT_ID` below are the single place to point the app at a real
 *    backend (Next.js API routes, Supabase, Firebase, or a custom REST API).
 *  - When moving to multi-tenant SaaS, `TENANT_ID` should come from auth/session, not a constant.
 *  - `STORAGE_DRIVER` selects which StorageAdapter implementation the repositories use; add
 *    'supabase' | 'firebase' | 'rest' here later without touching repository code.
 */
export const APP = Object.freeze({
  name: 'Invoice Template Studio',
  nameAr: 'استوديو قوالب الفواتير',
  version: '1.0.0',
});

// Saudi business defaults.
export const BUSINESS = Object.freeze({
  vatRate: 0.15, // 15% standard KSA VAT
  currency: 'SAR',
  currencyAr: 'ر.س',
  country: 'SA',
  locale: 'ar-SA',
});

// Backend / data-layer switches (see ROADMAP above).
export const BACKEND = Object.freeze({
  STORAGE_DRIVER: 'localStorage', // 'localStorage' | 'supabase' | 'firebase' | 'rest'
  API_BASE_URL: '', // e.g. 'https://api.example.com' — empty = offline/local mode
  TENANT_ID: 'default', // multi-tenant key; replace with session tenant later
});

// LocalStorage namespaces (repository keys).
export const KEYS = Object.freeze({
  invoices: 'its.invoices',
  templates: 'its.templates.custom',
  favorites: 'its.favorites',
  settings: 'its.settings',
});

// CDN libraries (loaded lazily by the services that need them).
export const CDN = Object.freeze({
  pdfjs: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.min.mjs',
  pdfjsWorker: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs',
  tesseract: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.0.5/dist/tesseract.min.js',
  jsQR: 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js',
  qrcode: 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js',
  html2canvas: 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
  jsPDF: 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
});

export const TEMPLATE_CATEGORIES = [
  'Corporate', 'Modern', 'Executive', 'Construction',
  'Transport', 'Travel Agency', 'Retail',
];
