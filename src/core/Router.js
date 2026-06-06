/**
 * Hash-based SPA router. Hash routing is deliberate: GitHub Pages serves a single
 * index.html with no server-side rewrites, so `#/route` works on direct loads & refresh.
 *
 * Routes are registered as: { path: '/gallery', handler: (params) => component }
 * Supports a single `:param` segment (e.g. '/designer/:id').
 */
import { bus, EVENTS } from './EventBus.js';

export class Router {
  constructor(outlet) {
    this.outlet = outlet; // DOM element to render pages into
    this.routes = [];
    this.notFound = null;
    this._current = null;
    window.addEventListener('hashchange', () => this._resolve());
  }

  add(path, handler) {
    // Convert '/designer/:id' -> regex with named group.
    const keys = [];
    const pattern = path.replace(/:([^/]+)/g, (_, k) => { keys.push(k); return '([^/]+)'; });
    this.routes.push({ regex: new RegExp(`^${pattern}$`), keys, handler, path });
    return this;
  }

  setNotFound(handler) { this.notFound = handler; return this; }

  start() { this._resolve(); }

  navigate(path) { window.location.hash = path; }

  _path() {
    const h = window.location.hash.replace(/^#/, '');
    return h || '/gallery';
  }

  async _resolve() {
    const path = this._path();
    let matched = null; let params = {};
    for (const r of this.routes) {
      const m = path.match(r.regex);
      if (m) {
        matched = r;
        r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
        break;
      }
    }

    // Tear down previous page if it exposed a cleanup hook.
    if (this._current?.unmount) { try { this._current.unmount(); } catch (e) { /* noop */ } }
    this.outlet.innerHTML = '';

    const handler = matched ? matched.handler : this.notFound;
    if (!handler) return;

    const page = await handler(params);
    this._current = page;
    if (page?.el) this.outlet.appendChild(page.el);
    else if (page instanceof Node) this.outlet.appendChild(page);

    bus.emit(EVENTS.ROUTE_CHANGED, { path, params });
    window.scrollTo(0, 0);
  }
}
