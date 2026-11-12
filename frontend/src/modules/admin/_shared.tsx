import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { staffBase } from '@/routes/navigation';
import { useCollection } from '@/hooks/useCollection';
import type { ClassRoom } from '@/types';

/** Current staff role helpers (admin vs office). */
export function useStaff() {
  const { user } = useAuth();
  const role = user?.role ?? 'admin';
  return { user, role, isAdmin: role === 'admin', base: staffBase(role) };
}

/** Class lookups + option lists. */
export function useClasses() {
  const { items, loading, ...rest } = useCollection('classes');
  const classes = useMemo(() => [...items].sort((a, b) => a.order - b.order), [items]);
  const name = (id?: string) => classes.find((c) => c.id === id)?.name ?? id ?? '—';
  const classOptions = classes.map((c) => ({ value: c.id, label: c.name }));
  const sectionsOf = (id?: string) => classes.find((c) => c.id === id)?.sections ?? ['A'];
  const classSections = classes.flatMap((c: ClassRoom) => c.sections.map((s) => ({ value: `${c.id}-${s}`, label: `${c.name} – ${s}` })));
  return { classes, loading, name, classOptions, sectionsOf, classSections, ...rest };
}

export function QuickAction({ to, icon: Icon, label, desc }: { to: string; icon: LucideIcon; label: string; desc: string }) {
  return (
    <Link to={to} className="group flex items-center gap-3 rounded-xl border border-navy-100 bg-white p-4 transition hover:-translate-y-0.5 hover:border-gold-300 hover:shadow-soft">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-gold-300"><Icon className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-navy-900">{label}</span>
        <span className="block truncate text-xs text-navy-400">{desc}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-navy-300 transition group-hover:translate-x-0.5 group-hover:text-gold-600" />
    </Link>
  );
}

/** Simple horizontal bar list. */
export function BarList({ rows, format = (n) => String(n), tone = 'navy' }: { rows: { label: string; value: number; sub?: ReactNode; max?: number }[]; format?: (n: number) => string; tone?: 'navy' | 'gold' }) {
  const globalMax = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-navy-700">{r.label}</span>
            <span className="text-navy-500">{format(r.value)}{r.sub}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-navy-50">
            <div className={tone === 'gold' ? 'h-full rounded-full bg-gold-500' : 'h-full rounded-full bg-navy-700'} style={{ width: `${Math.min(100, (r.value / Math.max(1, r.max ?? globalMax)) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Vertical column chart (pure CSS). */
export function ColumnChart({ data, format }: { data: { label: string; value: number }[]; format: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex h-48 items-end gap-2 sm:gap-3">
      {data.map((d) => (
        <div key={d.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-[10px] font-medium text-navy-500 opacity-0 transition group-hover:opacity-100">{format(d.value)}</span>
          <div className="w-full rounded-t-md bg-navy-800 transition group-hover:bg-gold-500" style={{ height: `${Math.max(2, (d.value / max) * 85)}%` }} title={`${d.label}: ${format(d.value)}`} />
          <span className="text-[10px] text-navy-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Multi-select as toggle chips. */
export function ChipPicker({ options, value, onChange }: { options: { value: string; label: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-lg border border-navy-100 bg-mist/50 p-2">
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button type="button" key={o.value} aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== o.value) : [...value, o.value])}
            className={(on ? 'bg-navy-900 text-white ring-navy-900' : 'bg-white text-navy-600 ring-navy-100 hover:ring-navy-300') + ' rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition'}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
export const RECEIPT_YEAR = '2026-27';
export function nextReceiptNo(existing: { receiptNo: string; status: string }[]) {
  const nums = existing.filter((p) => p.status === 'Success').map((p) => Number(p.receiptNo.split('/').pop()) || 0);
  return `SPS/${RECEIPT_YEAR}/${String(Math.max(0, ...nums) + 1).padStart(4, '0')}`;
}
