/**
 * StorageAdapter — the data-layer contract. Repositories depend on THIS, never on a concrete
 * storage. Swapping persistence later = implement this interface, no repository changes.
 *
 * ROADMAP (future adapters — drop-in implementations of this same interface):
 *
 *  PostgreSQL (via Next.js API route / server):
 *    class PostgresAdapter extends StorageAdapter {
 *      async getAll(c){ return (await sql`SELECT data FROM ${c} WHERE tenant_id=${TENANT_ID}`).map(r=>r.data); }
 *      ...
 *    }
 *
 *  Supabase:
 *    const { data } = await supabase.from(collection).select('*').eq('tenant_id', TENANT_ID);
 *
 *  Firebase (Firestore):
 *    const snap = await getDocs(query(collection(db, collection), where('tenantId','==',TENANT_ID)));
 *
 *  REST API:
 *    return fetch(`${API_BASE_URL}/${collection}`, { headers }).then(r => r.json());
 *
 * NOTE: methods are async on purpose so callers are already await-ready for real backends,
 * even though LocalStorage is synchronous today.
 */
export class StorageAdapter {
  /* eslint-disable no-unused-vars */
  async getAll(collection) { throw new Error('not implemented'); }
  async get(collection, id) { throw new Error('not implemented'); }
  async put(collection, id, value) { throw new Error('not implemented'); }
  async remove(collection, id) { throw new Error('not implemented'); }
  async clear(collection) { throw new Error('not implemented'); }
}
