import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { school } from '@/data/school';

/** Placeholder crest – replace with the school's official logo file (src/assets/logo.svg). */
export function Crest({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 56" className={clsx('shrink-0', className)} aria-hidden>
      <path d="M24 2 4 9v17c0 13 8.5 23 20 28 11.5-5 20-15 20-28V9L24 2Z" fill="#0B1A33" stroke="#C29234" strokeWidth="2" />
      <path d="M24 14 12 20l12 6 12-6-12-6Z" fill="#D2A845" />
      <path d="M16 25v6c0 2.6 3.6 5 8 5s8-2.4 8-5v-6l-8 4-8-4Z" fill="#fff" />
      <path d="M36 21v9" stroke="#D2A845" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ light, compact, to = '/' }: { light?: boolean; compact?: boolean; to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-3" aria-label={`${school.name} home`}>
      <Crest className="h-11 w-10" />
      {!compact && (
        <div className="leading-tight">
          <p className={clsx('font-serif text-[17px] font-semibold', light ? 'text-white' : 'text-navy-900')}>{school.name}</p>
          <p className={clsx('text-[11px] font-medium uppercase tracking-[0.18em]', light ? 'text-gold-300' : 'text-gold-600')}>{school.town} · {school.state}</p>
        </div>
      )}
    </Link>
  );
}
