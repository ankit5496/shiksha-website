import { useMemo, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { EmptyState, Skeleton } from './Display';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  /** value used for search & sort when render is custom */
  value?: (row: T) => string | number;
  className?: string;
  sortable?: boolean;
}

interface Props<T> {
  rows: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchPlaceholder?: string;
  /** extra controls (filters) rendered next to the search */
  toolbar?: ReactNode;
  actions?: (row: T) => ReactNode;
  pageSize?: number;
  emptyTitle?: string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  searchable?: boolean;
}

/** Search + sort + paginate table used across admin modules. */
export function DataTable<T extends { id: string }>({ rows, columns, loading, searchPlaceholder = 'Search…', toolbar, actions, pageSize = 10, emptyTitle, emptyMessage, onRowClick, searchable = true }: Props<T>) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);

  const val = (row: T, c: Column<T>) => (c.value ? c.value(row) : (row as Record<string, unknown>)[c.key]) as string | number;

  const filtered = useMemo(() => {
    let r = rows;
    if (q.trim()) {
      const s = q.toLowerCase();
      r = r.filter((row) => columns.some((c) => String(val(row, c) ?? '').toLowerCase().includes(s)));
    }
    if (sort) {
      const c = columns.find((x) => x.key === sort.key);
      if (c) r = [...r].sort((a, b) => (val(a, c) > val(b, c) ? 1 : val(a, c) < val(b, c) ? -1 : 0) * sort.dir);
    }
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, sort, columns]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const cur = Math.min(page, pages);
  const shown = filtered.slice((cur - 1) * pageSize, cur * pageSize);

  return (
    <div className="card overflow-hidden">
      {(searchable || toolbar) && (
        <div className="flex flex-col gap-3 border-b border-navy-50 p-4 lg:flex-row lg:items-center lg:justify-between">
          {searchable && (
            <div className="relative w-full lg:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
              <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={searchPlaceholder} className="input pl-9" aria-label="Search table" />
            </div>
          )}
          {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
        </div>
      )}
      <div className="scrollbar-thin overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={c.className}>
                  {c.sortable !== false ? (
                    <button className="inline-flex items-center gap-1 uppercase hover:text-navy-800" onClick={() => setSort((s) => (s?.key === c.key ? { key: c.key, dir: (s.dir * -1) as 1 | -1 } : { key: c.key, dir: 1 }))}>
                      {c.header}{sort?.key === c.key && <span>{sort.dir === 1 ? '↑' : '↓'}</span>}
                    </button>
                  ) : c.header}
                </th>
              ))}
              {actions && <th className="text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <tr key={i}>{columns.map((c) => <td key={c.key}><Skeleton className="h-4 w-full" /></td>)}{actions && <td />}</tr>
            ))}
            {!loading && shown.map((row) => (
              <tr key={row.id} onClick={onRowClick ? () => onRowClick(row) : undefined} className={onRowClick ? 'cursor-pointer' : undefined}>
                {columns.map((c) => <td key={c.key} className={c.className}>{c.render ? c.render(row) : String(val(row, c) ?? '—')}</td>)}
                {actions && <td className="text-right" onClick={(e) => e.stopPropagation()}><div className="flex justify-end gap-1">{actions(row)}</div></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!loading && filtered.length === 0 && <EmptyState title={emptyTitle ?? (q ? 'No matching records' : 'No records yet')} message={emptyMessage ?? (q ? 'Try a different search term or filter.' : undefined)} />}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between border-t border-navy-50 px-4 py-3 text-xs text-navy-500">
          <span>Showing {(cur - 1) * pageSize + 1}–{Math.min(cur * pageSize, filtered.length)} of {filtered.length}</span>
          <div className="flex items-center gap-1">
            <button className="btn-ghost btn-sm" disabled={cur === 1} onClick={() => setPage(cur - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
            <span className="px-2">Page {cur} / {pages}</span>
            <button className="btn-ghost btn-sm" disabled={cur === pages} onClick={() => setPage(cur + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
