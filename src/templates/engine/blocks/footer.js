/**
 * Footer block variants.
 */
import { esc } from '../../../utils/dom.js';
import { bl, blText, T } from '../labels.js';

function notes(c) {
  return c.invoice.notes ? `<div class="ft-notes">${esc(c.invoice.notes)}</div>` : '';
}

/** True if the invoice has any bank/payment field filled. */
export function hasBankDetails(invoice) {
  const co = invoice.company || {};
  return [co.payeeName, co.accountNumber, co.bankName, co.bankBranch, co.iban, co.swift]
    .some((v) => v && String(v).trim());
}

/** Bank/payment details table (rendered on its own page). */
export function buildBankTable(c) {
  const co = c.invoice.company;
  const dash = (v) => (v == null || v === '' ? '—' : esc(v));
  const cell = (key, val) => `<div class="zd-cell"><span class="zd-lbl">${bl(key)}</span><span class="zd-val">${dash(val)}</span></div>`;
  return `
    <div class="zd ft-bank">
      <div class="zd-head"><span>${T.paymentDetails[0]}</span><span>${T.paymentDetails[1]}</span></div>
      <div class="zd-grid"><div class="zd-cell zd-cell--wide"><span class="zd-lbl">${bl('payeeName')}</span><span class="zd-val">${dash(co.payeeName)}</span></div></div>
      <div class="zd-grid zd-grid--bank">
        ${cell('accountNumber', co.accountNumber)}
        ${cell('bank', co.bankName)}
        ${cell('branch', co.bankBranch)}
        ${cell('iban', co.iban)}
        ${cell('swift', co.swift)}
      </div>
    </div>`;
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
      <div class="ft-thanks">${T.thanks[0]}</div>
      <div class="ft-thanks-en">${T.thanks[1]}</div>
      <div class="ft-contact">${contact(c)}</div>
    </div>`,

  // Signature + stamp boxes.
  'signature-stamp': (c) => `
    <div class="ft ft--sig">
      ${notes(c)}
      <div class="ft-sig-row">
        <div class="ft-sig-box"><span>${blText('signature')}</span></div>
        <div class="ft-sig-box ft-stamp"><span>${blText('stamp')}</span></div>
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

  // ZATCA address footer: computer-generated note + company address & contact line.
  // (Bank/payment details live on a separate page — see buildBankTable / TemplateEngine.renderBankPage.)
  address: (c) => {
    const co = c.invoice.company;
    const contactBits = [
      co.phone && `Tel: ${co.phone}`,
      co.email && `E-mail: ${co.email}`,
      co.website && `Website: ${co.website}`,
    ].filter(Boolean).map(esc).join(' &nbsp;-&nbsp; ');
    return `
      <div class="ft ft--address">
        <div class="ft-cg">${T.computerGenerated[1]} — ${T.computerGenerated[0]}</div>
        <div class="ft-addr-rule"></div>
        ${co.address ? `<div class="ft-addr">${esc(co.address)}</div>` : ''}
        ${contactBits ? `<div class="ft-contact2">${contactBits}</div>` : ''}
      </div>`;
  },

  // Gradient footer band.
  gradient: (c) => `
    <div class="ft ft--gradient">
      ${notes(c)}
      <div class="ft-grad-row"><span>${T.thanks[0]} · ${T.thanks[1]}</span><span>${contact(c)}</span></div>
    </div>`,
};
