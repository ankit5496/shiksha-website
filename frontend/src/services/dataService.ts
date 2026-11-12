import type { CollectionMap, CollectionName } from '@/types';
import { DATA_MODE } from './config';
import { http } from './http';
import { mockDb } from './mockDb';
import { uid } from '@/utils/format';

/**
 * Generic repository used by every module. Swap DATA_MODE to "api" to hit the Express backend
 * (same resource names: GET/POST /api/:collection, PUT/DELETE /api/:collection/:id).
 */
export interface Repository<T extends { id: string }> {
  list(): Promise<T[]>;
  get(id: string): Promise<T | undefined>;
  create(data: Omit<T, 'id'> & { id?: string }): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T>;
  remove(id: string): Promise<void>;
  bulkUpsert(rows: T[]): Promise<void>;
}

const delay = (ms = 180) => new Promise((r) => setTimeout(r, ms));

function mockRepo<K extends CollectionName>(name: K): Repository<CollectionMap[K]> {
  type T = CollectionMap[K];
  return {
    async list() { await delay(120); return [...mockDb.all(name)]; },
    async get(id) { await delay(60); return mockDb.all(name).find((r) => r.id === id); },
    async create(data) {
      await delay();
      const row = { ...data, id: data.id ?? uid(name.slice(0, 2)) } as T;
      mockDb.set(name, [row, ...mockDb.all(name)]);
      return row;
    },
    async update(id, patch) {
      await delay();
      let updated: T | undefined;
      mockDb.set(name, mockDb.all(name).map((r) => (r.id === id ? (updated = { ...r, ...patch, id }) : r)));
      if (!updated) throw new Error('Record not found');
      return updated;
    },
    async remove(id) { await delay(); mockDb.set(name, mockDb.all(name).filter((r) => r.id !== id)); },
    async bulkUpsert(rows) {
      await delay();
      const map = new Map(mockDb.all(name).map((r) => [r.id, r]));
      rows.forEach((r) => map.set(r.id, r));
      mockDb.set(name, [...map.values()]);
    },
  };
}

const apiListeners = new Set<(c: CollectionName) => void>();
function apiRepo<K extends CollectionName>(name: K): Repository<CollectionMap[K]> {
  type T = CollectionMap[K];
  const notify = () => apiListeners.forEach((l) => l(name));
  return {
    list: () => http<T[]>(`/${name}`),
    get: (id) => http<T>(`/${name}/${id}`),
    async create(data) { const r = await http<T>(`/${name}`, { method: 'POST', body: JSON.stringify(data) }); notify(); return r; },
    async update(id, patch) { const r = await http<T>(`/${name}/${id}`, { method: 'PUT', body: JSON.stringify(patch) }); notify(); return r; },
    async remove(id) { await http(`/${name}/${id}`, { method: 'DELETE' }); notify(); },
    async bulkUpsert(rows) { await http(`/${name}/bulk`, { method: 'POST', body: JSON.stringify(rows) }); notify(); },
  };
}

export function repo<K extends CollectionName>(name: K): Repository<CollectionMap[K]> {
  return DATA_MODE === 'api' ? apiRepo(name) : mockRepo(name);
}

/** Subscribe to changes of any collection (used by useCollection to stay in sync across components). */
export function onDataChange(fn: (c: CollectionName) => void) {
  if (DATA_MODE === 'api') { apiListeners.add(fn); return () => { apiListeners.delete(fn); }; }
  return mockDb.subscribe(fn);
}

export function resetDemoData() { mockDb.reset(); }
