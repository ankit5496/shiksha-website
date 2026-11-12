import { buildSeed } from '@/data/seed';
import type { CollectionMap, CollectionName } from '@/types';

/**
 * In-browser demo database persisted to localStorage.
 * Acts as a drop-in stand-in for the REST API so the demo works without a backend.
 */
const KEY = 'sps-demo-db-v1';
type DB = { [K in CollectionName]: CollectionMap[K][] };

let db: DB | null = null;
const listeners = new Set<(c: CollectionName) => void>();

function load(): DB {
  if (db) return db;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { db = JSON.parse(raw) as DB; return db; }
  } catch { /* ignore corrupt storage */ }
  db = buildSeed();
  persist();
  return db;
}

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* quota or private mode – keep in memory */ }
}

export const mockDb = {
  all<K extends CollectionName>(name: K): CollectionMap[K][] {
    return (load()[name] ?? []) as CollectionMap[K][];
  },
  set<K extends CollectionName>(name: K, rows: CollectionMap[K][]) {
    const d = load();
    (d as Record<string, unknown[]>)[name] = rows;
    persist();
    listeners.forEach((l) => l(name));
  },
  subscribe(fn: (c: CollectionName) => void) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
  reset() {
    db = buildSeed();
    persist();
    (Object.keys(db) as CollectionName[]).forEach((c) => listeners.forEach((l) => l(c)));
  },
};
