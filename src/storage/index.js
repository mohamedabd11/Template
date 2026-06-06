/**
 * Data-layer wiring. Selects the active StorageAdapter based on config.
 * ROADMAP: add cases for 'supabase' | 'firebase' | 'rest' here.
 */
import { BACKEND } from '../core/config.js';
import { LocalStorageAdapter } from './LocalStorageAdapter.js';

function createAdapter() {
  switch (BACKEND.STORAGE_DRIVER) {
    case 'localStorage':
    default:
      return new LocalStorageAdapter();
    // case 'supabase': return new SupabaseAdapter();
    // case 'firebase': return new FirebaseAdapter();
    // case 'rest':     return new RestAdapter(BACKEND.API_BASE_URL);
  }
}

export const adapter = createAdapter();
