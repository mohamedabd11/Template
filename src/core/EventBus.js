/**
 * Tiny pub/sub event bus. Decouples services/pages from each other.
 * React-portable: in a future React app this maps cleanly onto context + reducers.
 */
class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  on(event, handler) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    this._listeners.get(event)?.delete(handler);
  }

  emit(event, payload) {
    this._listeners.get(event)?.forEach((h) => {
      try { h(payload); } catch (e) { console.error(`[EventBus] handler for "${event}" failed`, e); }
    });
  }
}

export const bus = new EventBus();

export const EVENTS = Object.freeze({
  ROUTE_CHANGED: 'route:changed',
  INVOICE_CHANGED: 'invoice:changed',
  TEMPLATE_SELECTED: 'template:selected',
  TOAST: 'ui:toast',
});
