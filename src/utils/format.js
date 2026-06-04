/**
 * Formatting helpers: currency (SAR), dates, numbers. Display-only — never mutates source data.
 */
import { BUSINESS } from '../core/config.js';

const nf = new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Format an amount as SAR. `withSymbol` appends ر.س. */
export function money(value, withSymbol = true) {
  const n = Number(value || 0);
  const s = nf.format(n);
  return withSymbol ? `${s} ${BUSINESS.currencyAr}` : s;
}

/** Plain 2-decimal number (no currency). */
export function num(value) { return nf.format(Number(value || 0)); }

/** Format an ISO/date string to Saudi-style date. Falls back to raw string. */
export function date(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d)) return String(value);
  return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
}

/** Convert Western digits to Arabic-Indic (optional, used by some templates). */
export function toArabicDigits(str) {
  const map = '٠١٢٣٤٥٦٧٨٩';
  return String(str ?? '').replace(/[0-9]/g, (d) => map[+d]);
}
