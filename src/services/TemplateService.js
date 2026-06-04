/**
 * TemplateService — loads built-in templates (from /src/templates via fetch), merges in
 * user/custom templates (from TemplateRepository), and supports duplicate/customize.
 *
 * Built-in templates are file-based (template.json + template.css) so new ones can be added
 * by dropping a folder + a registry entry — no code change. Custom templates live in storage.
 *
 * ROADMAP: when templates move to a DB, replace the fetch() calls with adapter/API reads.
 */
import { Template } from '../models/Template.js';
import { TemplateRepository } from '../storage/TemplateRepository.js';

const REGISTRY_URL = new URL('../templates/templates.index.json', import.meta.url);
const _cache = new Map(); // id -> Template (with css loaded)
let _registry = null;

async function loadRegistry() {
  if (_registry) return _registry;
  const res = await fetch(REGISTRY_URL);
  _registry = (await res.json()).templates;
  return _registry;
}

async function loadBuiltin(id) {
  if (_cache.has(id)) return _cache.get(id);
  const base = new URL(`../templates/${id}/`, import.meta.url);
  const [json, css] = await Promise.all([
    fetch(new URL('template.json', base)).then((r) => r.json()),
    fetch(new URL('template.css', base)).then((r) => r.text()).catch(() => ''),
  ]);
  const tpl = Template.fromJSON({ ...json, css, builtin: true });
  _cache.set(id, tpl);
  return tpl;
}

export const TemplateService = {
  /** Lightweight registry list (for gallery cards: id/name/category/tags). */
  async listMeta() {
    const builtin = await loadRegistry();
    const custom = (await TemplateRepository.list()).map((t) => ({
      id: t.id, name: t.name, nameEn: t.nameEn, category: t.category, tags: t.tags, builtin: false,
    }));
    return [...builtin, ...custom];
  },

  /** Full template (config + css) by id, built-in or custom. */
  async get(id) {
    const custom = await TemplateRepository.get(id);
    if (custom) return custom;
    return loadBuiltin(id);
  },

  /** Duplicate a template into a user-owned copy (returned & persisted). */
  async duplicate(id, newName) {
    const src = await this.get(id);
    const copy = Template.fromJSON({
      ...src.toJSON(),
      id: crypto.randomUUID(),
      name: newName || `${src.name} (نسخة)`,
      builtin: false,
      basedOn: src.id,
    });
    await TemplateRepository.save(copy);
    return copy;
  },

  /** Persist a customized template. */
  async saveCustom(template) {
    template.builtin = false;
    return TemplateRepository.save(template);
  },

  async removeCustom(id) { return TemplateRepository.remove(id); },
};
