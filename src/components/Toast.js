/** Toast notifications driven by the event bus. Mount once at app start. */
import { h } from '../utils/dom.js';
import { bus, EVENTS } from '../core/EventBus.js';

export function mountToasts() {
  const root = h('div', { class: 'fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center' });
  document.body.appendChild(root);

  bus.on(EVENTS.TOAST, ({ message, type = 'info' } = {}) => {
    const colors = {
      info: 'bg-slate-800', success: 'bg-emerald-600', error: 'bg-rose-600', warn: 'bg-amber-600',
    };
    const t = h('div', {
      class: `${colors[type] || colors.info} text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium animate-[fadeIn_.2s_ease] max-w-sm text-center`,
    }, message);
    root.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 3200);
  });
}

export function toast(message, type = 'info') { bus.emit(EVENTS.TOAST, { message, type }); }
