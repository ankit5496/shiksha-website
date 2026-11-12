import type { ReactNode } from 'react';
import { Inbox, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { initials } from '@/utils/format';

export type Tone = 'navy' | 'gold' | 'green' | 'red' | 'amber' | 'blue' | 'grey';
const toneCls: Record<Tone, string> = {
  navy: 'bg-navy-50 text-navy-700 ring-navy-100',
  gold: 'bg-gold-50 text-gold-800 ring-gold-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  red: 'bg-red-50 text-red-700 ring-red-100',
  amber: 'bg-amber-50 text-amber-800 ring-amber-100',
  blue: 'bg-sky-50 text-sky-700 ring-sky-100',
  grey: 'bg-mist text-navy-500 ring-navy-100',
};

export function Badge({ tone = 'navy', children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', toneCls[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Map common status strings to badge tones. */
export function statusTone(s: string): Tone {
  const k = s.toLowerCase();
  if (['paid', 'success', 'approved', 'active', 'present', 'graded', 'submitted', 'reached school', 'closed', 'on time'].includes(k)) return 'green';
  if (['failed', 'rejected', 'absent', 'overdue', 'inactive', 'missing', 'maintenance'].includes(k)) return 'red';
  if (['pending', 'late', 'due', 'on leave', 'stopped', 'new', 'due soon'].includes(k)) return 'amber';
  if (['on route', 'contacted', 'upcoming'].includes(k)) return 'blue';
  return 'grey';
}
export const StatusBadge = ({ status }: { status: string }) => <Badge tone={statusTone(status)} dot>{status}</Badge>;

export function StatCard({ label, value, icon, hint, tone = 'navy', trend }: { label: string; value: ReactNode; icon?: ReactNode; hint?: ReactNode; tone?: 'navy' | 'gold' | 'green' | 'red' | 'blue'; trend?: ReactNode }) {
  const iconBg = { navy: 'bg-navy-50 text-navy-700', gold: 'bg-gold-50 text-gold-700', green: 'bg-emerald-50 text-emerald-700', red: 'bg-red-50 text-red-600', blue: 'bg-sky-50 text-sky-700' }[tone];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{label}</p>
          <p className="mt-2 truncate font-serif text-2xl font-semibold text-navy-900">{value}</p>
        </div>
        {icon && <div className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', iconBg)}>{icon}</div>}
      </div>
      {(hint || trend) && <div className="mt-3 flex items-center gap-2 text-xs text-navy-500">{trend}{hint}</div>}
    </motion.div>
  );
}

export function PageHeader({ title, subtitle, actions, eyebrow }: { title: string; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h1 className="font-serif text-2xl font-semibold text-navy-900 sm:text-[1.75rem]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-navy-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, subtitle, action, children, className, bodyClassName }: { title?: ReactNode; subtitle?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section className={clsx('card overflow-hidden', className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-navy-50 px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="truncate text-[15px] font-semibold text-navy-900">{title}</h2>}
            {subtitle && <p className="text-xs text-navy-400">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={clsx('p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

export function EmptyState({ title = 'Nothing here yet', message, icon, action }: { title?: string; message?: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-mist text-navy-400">{icon ?? <Inbox className="h-6 w-6" />}</div>
      <p className="font-semibold text-navy-800">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-navy-400">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return <div className="flex items-center justify-center gap-2 py-12 text-sm text-navy-400"><Loader2 className="h-5 w-5 animate-spin" />{label}</div>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded-lg bg-navy-50', className)} />;
}

export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: { value: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={clsx('scrollbar-thin flex gap-1 overflow-x-auto rounded-xl bg-mist p-1', className)} role="tablist">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={clsx('relative whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition', value === t.value ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-500 hover:text-navy-800')}>
          {t.label}
          {t.count !== undefined && <span className={clsx('ml-1.5 rounded-full px-1.5 text-[11px]', value === t.value ? 'bg-navy-900 text-white' : 'bg-navy-100 text-navy-600')}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Avatar({ src, name, size = 40, className }: { src?: string; name: string; size?: number; className?: string }) {
  return src ? (
    <img src={src} alt={name} width={size} height={size} style={{ width: size, height: size }} className={clsx('shrink-0 rounded-full object-cover ring-2 ring-white', className)}
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
  ) : (
    <div style={{ width: size, height: size }} className={clsx('flex shrink-0 items-center justify-center rounded-full bg-navy-100 text-xs font-semibold text-navy-700', className)}>{initials(name)}</div>
  );
}

export function DemoBadge({ children = 'Demo content', className }: { children?: ReactNode; className?: string }) {
  return <span className={clsx('inline-flex items-center gap-1 rounded-full border border-dashed border-gold-400 bg-gold-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-700', className)}>{children}</span>;
}

export function ProgressBar({ value, tone = 'navy', className }: { value: number; tone?: 'navy' | 'gold' | 'green' | 'red'; className?: string }) {
  const c = { navy: 'bg-navy-700', gold: 'bg-gold-500', green: 'bg-emerald-500', red: 'bg-red-500' }[tone];
  return (
    <div className={clsx('h-2 w-full overflow-hidden rounded-full bg-navy-50', className)}>
      <motion.div className={clsx('h-full rounded-full', c)} initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(0, value))}%` }} transition={{ duration: 0.6 }} />
    </div>
  );
}
