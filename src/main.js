/**
 * App bootstrap — wires the router, navbar, toasts, and PWA install handling.
 */
import { Router } from './core/Router.js';
import { Navbar } from './components/Navbar.js';
import { mountToasts } from './components/Toast.js';
import { h } from './utils/dom.js';

import { GalleryPage } from './pages/GalleryPage.js';
import { ImportPage } from './pages/ImportPage.js';
import { PreviewPage } from './pages/PreviewPage.js';
import { DesignerPage } from './pages/DesignerPage.js';

function boot() {
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.appendChild(Navbar());
  const outlet = h('main', { id: 'outlet' });
  app.appendChild(outlet);
  mountToasts();

  const router = new Router(outlet);
  router
    .add('/gallery', GalleryPage)
    .add('/import', ImportPage)
    .add('/preview', PreviewPage)
    .add('/preview/:id', PreviewPage)
    .add('/designer/:id', DesignerPage)
    .setNotFound(() => ({ el: h('div', { class: 'max-w-3xl mx-auto p-12 text-center text-slate-400' }, 'الصفحة غير موجودة') }));
  router.start();
}

// ---- PWA: service worker + custom install prompt ----
function initPwa() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(new URL('../sw.js', import.meta.url), { scope: './' }).catch(() => {});
    });
  }

  let deferred = null;
  const btn = document.getElementById('pwa-install-btn');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferred = e;
    if (btn) { btn.classList.remove('hidden'); btn.classList.add('flex'); }
  });
  btn?.addEventListener('click', async () => {
    if (!deferred) return;
    deferred.prompt(); await deferred.userChoice; deferred = null;
    btn.classList.add('hidden');
  });
  window.addEventListener('appinstalled', () => btn?.classList.add('hidden'));

  // iOS has no beforeinstallprompt — show a one-time hint.
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (isIos && !standalone && !localStorage.getItem('its.iosHintSeen')) {
    setTimeout(() => {
      localStorage.setItem('its.iosHintSeen', '1');
      const hint = h('div', { class: 'fixed bottom-4 inset-x-4 z-[80] bg-slate-900 text-white text-sm rounded-xl p-3 shadow-lg flex items-center justify-between gap-2' },
        h('span', {}, 'لتثبيت التطبيق: اضغط زر المشاركة ثم «أضف إلى الشاشة الرئيسية»'),
        h('button', { class: 'text-white/70', onClick: (e) => e.target.closest('div').remove() }, '✕'));
      document.body.appendChild(hint);
    }, 2500);
  }
}

boot();
initPwa();
