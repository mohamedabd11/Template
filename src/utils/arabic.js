/**
 * RTL / Arabic helpers.
 */

/** Returns true if string contains Arabic characters. */
export function hasArabic(str) {
  return /[؀-ۿ]/.test(String(str || ''));
}

/** Pick direction for mixed content. */
export function dirFor(str) {
  return hasArabic(str) ? 'rtl' : 'ltr';
}
