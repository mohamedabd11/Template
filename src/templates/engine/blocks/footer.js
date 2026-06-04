/**
 * Footer block variants.
 */
import { esc } from '../../../utils/dom.js';

function notes(c) {
  return c.invoice.notes ? `<div class="ft-notes">${esc(c.invoice.notes)}</div>` : '';
}

function contact(c) {
  const co = c.invoice.company;
  return [co.phone, co.email, co.address].filter(Boolean).map(esc).join(' · ');
}

export const footerBlocks = {
  // Solid colored bar with contact info.
  bar: (c) => `
    <div class="ft ft--bar">
      ${notes(c)}
      <div class="ft-bar-row">
        <span>${esc(c.invoice.company.name || '')}</span>
        <span>${contact(c)}</span>
      </div>
    </div>`,

  // Centered thank-you note.
  'centered-note': (c) => `
    <div class="ft ft--note">
      ${notes(c)}
      <div class="ft-thanks">شكراً لتعاملكم معنا</div>
      <div class="ft-contact">${contact(c)}</div>
    </div>`,

  // Signature + stamp boxes.
  'signature-stamp': (c) => `
    <div class="ft ft--sig">
      ${notes(c)}
      <div class="ft-sig-row">
        <div class="ft-sig-box"><span>التوقيع</span></div>
        <div class="ft-sig-box ft-stamp"><span>الختم</span></div>
      </div>
      <div class="ft-contact">${contact(c)}</div>
    </div>`,

  // Technical blueprint strip.
  'blueprint-strip': (c) => `
    <div class="ft ft--blueprint">
      <div class="ft-bp-line"></div>
      ${notes(c)}
      <div class="ft-bp-row"><span>${esc(c.invoice.company.name || '')}</span><span>${contact(c)}</span></div>
    </div>`,

  // Gradient footer band.
  gradient: (c) => `
    <div class="ft ft--gradient">
      ${notes(c)}
      <div class="ft-grad-row"><span>شكراً لاختياركم ${esc(c.invoice.company.name || '')}</span><span>${contact(c)}</span></div>
    </div>`,
};
