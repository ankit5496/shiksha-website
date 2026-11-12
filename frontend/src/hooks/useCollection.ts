import { useCallback, useEffect, useRef, useState } from 'react';
import type { CollectionMap, CollectionName } from '@/types';
import { onDataChange, repo } from '@/services/dataService';

/**
 * Loads a collection and keeps it in sync with any create/update/delete made anywhere in the app.
 * Returns CRUD helpers that go through the repository (mock or API).
 */
export function useCollection<K extends CollectionName>(name: K) {
  type T = CollectionMap[K];
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const rows = await repo(name).list();
      if (mounted.current) { setItems(rows); setError(null); }
    } catch (e) {
      if (mounted.current) setError((e as Error).message);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [name]);

  useEffect(() => {
    mounted.current = true;
    refresh();
    const off = onDataChange((c) => { if (c === name) refresh(); });
    return () => { mounted.current = false; off(); };
  }, [name, refresh]);

  const r = repo(name);
  return {
    items, loading, error, refresh,
    create: (data: Omit<T, 'id'> & { id?: string }) => r.create(data),
    update: (id: string, patch: Partial<T>) => r.update(id, patch),
    remove: (id: string) => r.remove(id),
    bulkUpsert: (rows: T[]) => r.bulkUpsert(rows),
  };
}
