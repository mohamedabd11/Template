/**
 * Formatting helpers: currency (SAR), dates, numbers. Display-only — never mutates source data.
 */
import { BUSINESS } from '../core/config.js';

// Use Latin (Western) digits with standard grouping even in Arabic UI — the professional
// convention for invoices (e.g. "1,234.56"). The currency symbol stays Arabic (ر.س).
const nf = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Format an amount as SAR. `withSymbol` appends ر.س. */
export function money(value, withSymbol = true) {
  const n = Number(value || 0);
  const s = nf.format(n);
  return withSymbol ? `${s} ${BUSINESS.currencyAr}` : s;
}

/** Plain 2-decimal number (no currency), Latin digits. */
export function num(value) { return nf.format(Number(value || 0)); }

/** Format a date as DD/MM/YYYY (Gregorian) with Latin digits. Falls back to raw string. */
export function date(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d)) return String(value);
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
}

/**
 * Convert Western digits to Arabic-Indic. Retained for optional use; the default invoice
 * rendering keeps Latin digits (more professional), so this is no longer applied automatically.
 */
export function toArabicDigits(str) {
  const map = '٠١٢٣٤٥٦٧٨٩';
  return String(str ?? '').replace(/[0-9]/g, (d) => map[+d]);
}
