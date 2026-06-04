/**
 * Tafqeet — convert a number to Arabic words (amount in words), KSA Riyal + Halala.
 * Used by templates that display the total in words ("المبلغ كتابةً").
 */
const ONES = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة',
  'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر',
  'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
const TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const HUNDREDS = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
const SCALE = [
  { v: 1_000_000_000, s: ['مليار', 'ملياران', 'مليارات'] },
  { v: 1_000_000, s: ['مليون', 'مليونان', 'ملايين'] },
  { v: 1_000, s: ['ألف', 'ألفان', 'آلاف'] },
];

function under1000(n) {
  let out = [];
  const h = Math.floor(n / 100); n %= 100;
  if (h) out.push(HUNDREDS[h]);
  if (n < 20) { if (n) out.push(ONES[n]); }
  else { const o = n % 10; const t = Math.floor(n / 10); out.push(o ? `${ONES[o]} و${TENS[t]}` : TENS[t]); }
  return out.join(' و');
}

function group(n) {
  if (n === 0) return 'صفر';
  let parts = [];
  for (const { v, s } of SCALE) {
    if (n >= v) {
      const c = Math.floor(n / v); n %= v;
      let word;
      if (c === 1) word = s[0];
      else if (c === 2) word = s[1];
      else if (c >= 3 && c <= 10) word = `${under1000(c)} ${s[2]}`;
      else word = `${under1000(c)} ${s[0]}`;
      parts.push(word);
    }
  }
  if (n) parts.push(under1000(n));
  return parts.join(' و');
}

/** Convert amount to Arabic words including halalas. */
export function tafqeet(amount, currency = 'ريال سعودي', fraction = 'هللة') {
  const n = Math.abs(Number(amount || 0));
  const riyals = Math.floor(n);
  const halalas = Math.round((n - riyals) * 100);
  let out = `${group(riyals)} ${currency}`;
  if (halalas) out += ` و${group(halalas)} ${fraction}`;
  return `${out} فقط لا غير`;
}
