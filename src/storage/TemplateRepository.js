/**
 * TemplateRepository — persistence for CUSTOM (user-created/customized) templates.
 * Built-in templates are loaded from /src/templates by TemplateService; this repo only
 * stores user copies & edits.
 * ROADMAP: swap adapter for DB-backed templates (tenant-scoped) without API changes.
 */
import { adapter } from './index.js';
import { KEYS } from '../core/config.js';
import { Template } from '../models/Template.js';

export const TemplateRepository = {
  async list() {
    const rows = await adapter.getAll(KEYS.templates);
    return rows.map(Template.fromJSON);
  },

  async get(id) {
    const row = await adapter.get(KEYS.templates, id);
    return row ? Template.fromJSON(row) : null;
  },

  async save(template) {
    await adapter.put(KEYS.templates, template.id, template.toJSON());
    return template;
  },

  async remove(id) { await adapter.remove(KEYS.templates, id); },
};
