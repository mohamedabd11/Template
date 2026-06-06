/** Top navigation bar (SaaS shell). Includes the PWA install button. */
import { h } from '../utils/dom.js';
import { APP } from '../core/config.js';

export function Navbar() {
  const link = (href, label, icon) => h('a', {
    href: `#${href}`, class: 'nav-link px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5',
    dataset: { route: href },
  }, h('span', { class: 'text-base' }, icon), label);

  const nav = h('header', { class: 'sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200' },
    h('div', { class: 'max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4' },
      h('a', { href: '#/gallery', class: 'flex items-center gap-2.5 shrink-0' },
        h('div', { class: 'w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 grid place-items-center text-white font-extrabold' }, 'IT'),
        h('div', {},
          h('div', { class: 'font-extrabold text-slate-800 leading-tight' }, APP.nameAr),
          h('div', { class: 'text-[10px] text-slate-400 leading-tight' }, 'Invoice Template Studio'),
        ),
      ),
      h('nav', { class: 'hidden md:flex items-center gap-1' },
        link('/gallery', 'معرض القوالب', '🎨'),
        link('/import', 'إدخال فاتورة', '📥'),
        link('/preview', 'المعاينة', '👁️'),
      ),
      h('div', { class: 'flex items-center gap-2' },
        h('button', { id: 'pwa-install-btn', class: 'hidden items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition' }, '⬇️ تثبيت التطبيق'),
      ),
    ),
  );

  // Reflect active route.
  const sync = () => {
    const hash = location.hash || '#/gallery';
    nav.querySelectorAll('.nav-link').forEach((a) => {
      const active = hash.startsWith('#' + a.dataset.route);
      a.classList.toggle('bg-slate-100', active);
      a.classList.toggle('text-slate-900', active);
    });
  };
  window.addEventListener('hashchange', sync); setTimeout(sync);

  return nav;
}
