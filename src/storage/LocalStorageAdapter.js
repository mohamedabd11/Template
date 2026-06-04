/**
 * LocalStorageAdapter — current (v1) persistence. Stores each "collection" as a JSON map
 * keyed by id under a single LocalStorage key.
 *
 * ROADMAP: replace with PostgresAdapter/SupabaseAdapter/FirebaseAdapter/RestAdapter
 * (see StorageAdapter.js). Repositories will not change because they only use this interface.
 */
import { StorageAdapter } from './StorageAdapter.js';

export class LocalStorageAdapter extends StorageAdapter {
  _read(collection) {
    try { return JSON.parse(localStorage.getItem(collection) || '{}'); }
    catch { return {}; }
  }

  _write(collection, map) {
    localStorage.setItem(collection, JSON.stringify(map));
  }

  async getAll(collection) { return Object.values(this._read(collection)); }

  async get(collection, id) { return this._read(collection)[id] ?? null; }

  async put(collection, id, value) {
    const map = this._read(collection);
    map[id] = value;
    this._write(collection, map);
    return value;
  }

  async remove(collection, id) {
    const map = this._read(collection);
    delete map[id];
    this._write(collection, map);
  }

  async clear(collection) { localStorage.removeItem(collection); }
}
