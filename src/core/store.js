/**
 * App-wide reactive state (current invoice, selected template, ui flags).
 * Intentionally minimal — a single source of truth that pages read/write.
 * React-portable: this is essentially a hand-rolled store; swap for Zustand/Redux later.
 */
import { bus, EVENTS } from './EventBus.js';

const state = {
  currentInvoice: null, // Invoice instance (the data being re-designed)
  selectedTemplateId: null, // string
  qrContent: null, // preserved original QR payload (string) or null
  qrImageDataUrl: null, // uploaded/decoded QR image (data URL) if any
};

export const store = {
  get(key) { return state[key]; },

  set(key, value) {
    state[key] = value;
    if (key === 'currentInvoice') bus.emit(EVENTS.INVOICE_CHANGED, value);
    if (key === 'selectedTemplateId') bus.emit(EVENTS.TEMPLATE_SELECTED, value);
  },

  patch(obj) { Object.entries(obj).forEach(([k, v]) => this.set(k, v)); },

  snapshot() { return { ...state }; },
};
