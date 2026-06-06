/** Drag & drop / click file picker. */
import { h } from '../utils/dom.js';

export function FileDrop({ accept = '', label = 'اسحب الملف هنا أو انقر للاختيار', hint = '', onFile } = {}) {
  const input = h('input', { type: 'file', accept, class: 'hidden', onChange: (e) => e.target.files[0] && onFile?.(e.target.files[0]) });

  const zone = h('label', {
    class: 'file-drop',
    onDragover: (e) => { e.preventDefault(); zone.classList.add('is-over'); },
    onDragleave: () => zone.classList.remove('is-over'),
    onDrop: (e) => { e.preventDefault(); zone.classList.remove('is-over'); const f = e.dataTransfer.files[0]; if (f) onFile?.(f); },
  },
    h('div', { class: 'text-4xl mb-2' }, '📄'),
    h('div', { class: 'font-semibold text-slate-700' }, label),
    hint ? h('div', { class: 'text-xs text-slate-400 mt-1' }, hint) : null,
    input,
  );
  return zone;
}
