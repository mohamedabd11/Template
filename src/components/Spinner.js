import { h } from '../utils/dom.js';

export function Spinner(label = 'جارٍ التحميل…') {
  return h('div', { class: 'flex items-center gap-3 text-slate-500' },
    h('span', { class: 'inline-block w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin' }),
    h('span', {}, label),
  );
}
