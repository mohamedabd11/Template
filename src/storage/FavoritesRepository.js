/**
 * FavoritesRepository — set of favorited template ids (gallery ★).
 * ROADMAP: becomes a per-user table (user_id, template_id) in a real backend.
 */
import { adapter } from './index.js';
import { KEYS } from '../core/config.js';

export const FavoritesRepository = {
  async list() {
    const rows = await adapter.getAll(KEYS.favorites);
    return rows.map((r) => r.id);
  },

  async isFavorite(id) { return (await adapter.get(KEYS.favorites, id)) != null; },

  async toggle(id) {
    const exists = await adapter.get(KEYS.favorites, id);
    if (exists) { await adapter.remove(KEYS.favorites, id); return false; }
    await adapter.put(KEYS.favorites, id, { id });
    return true;
  },
};
