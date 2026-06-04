/** Generic modal dialog. Returns { el, close }. */
import { h } from '../utils/dom.js';

export function Modal({ title = '', body, actions = [], size = 'lg', onClose } = {}) {
  const widths = { sm: 'max-w-md', lg: 'max-w-3xl', xl: 'max-w-5xl', full: 'max-w-[1100px]' };

  const close = () => { overlay.remove(); onClose?.(); };

  const overlay = h('div', {
    class: 'fixed inset-0 z-[90] bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-auto',
    onClick: (e) => { if (e.target === overlay) close(); },
  },
    h('div', { class: `bg-white rounded-2xl shadow-2xl w-full ${widths[size] || widths.lg} my-8` },
      h('div', { class: 'flex items-center justify-between px-5 py-3.5 border-b border-slate-100' },
        h('h3', { class: 'font-bold text-slate-800' }, title),
        h('button', { class: 'text-slate-400 hover:text-slate-700 text-xl leading-none', onClick: close }, '×'),
      ),
      h('div', { class: 'p-5' }, body),
      actions.length
        ? h('div', { class: 'flex justify-start gap-2 px-5 py-3.5 border-t border-slate-100 bg-slate-50 rounded-b-2xl' }, ...actions)
        : null,
    ),
  );

  document.body.appendChild(overlay);
  return { el: overlay, close };
}
