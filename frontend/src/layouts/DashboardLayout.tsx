import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, ChevronDown, ExternalLink, Globe, LogOut, Menu, RotateCcw, X } from 'lucide-react';
import clsx from 'clsx';
import type { Role } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useCollection } from '@/hooks/useCollection';
import { useStudentContext } from '@/hooks/useStudentContext';
import { NAV, PORTAL_NAME } from '@/routes/navigation';
import { Crest } from '@/components/site/Logo';
import { Avatar } from '@/components/ui';
import { school } from '@/data/school';
import { fmtShort, relativeDay } from '@/utils/format';
import { resetDemoData } from '@/services/dataService';
import { DATA_MODE } from '@/services/config';

function Sidebar({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const items = NAV[role];
  const groups = useMemo(() => {
    const g: { name?: string; items: typeof items }[] = [];
    items.forEach((i) => {
      const last = g[g.length - 1];
      if (last && last.name === i.group) last.items.push(i); else g.push({ name: i.group, items: [i] });
    });
    return g;
  }, [items]);
  return (
    <div className="flex h-full flex-col bg-navy-950 text-navy-200">
      <Link to="/" className="flex items-center gap-3 px-5 py-5" onClick={onNavigate}>
        <Crest className="h-10 w-9" />
        <div className="leading-tight">
          <p className="font-serif text-[15px] font-semibold text-white">{school.name}</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-400">{PORTAL_NAME[role]}</p>
        </div>
      </Link>
      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-4" aria-label="Portal">
        {groups.map((g, gi) => (
          <div key={gi} className="mt-4 first:mt-1">
            {g.name && <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-navy-500">{g.name}</p>}
            {g.items.map((i) => (
              <NavLink key={i.to} to={i.to} end={i.to.split('/').length === 2} onClick={onNavigate}
                className={({ isActive }) => clsx('group relative mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition',
                  isActive ? 'bg-white/[0.08] text-white' : 'text-navy-300 hover:bg-white/[0.04] hover:text-white')}>
                {({ isActive }) => (<>
                  {isActive && <motion.span layoutId="side-active" className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-gold-400" />}
                  <i.icon className={clsx('h-[18px] w-[18px]', isActive ? 'text-gold-400' : 'text-navy-400 group-hover:text-navy-200')} />
                  {i.label}
                </>)}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-white/5 p-3">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-navy-300 hover:bg-white/[0.04] hover:text-white"><Globe className="h-4 w-4" />School website</Link>
      </div>
    </div>
  );
}

function useClickOutside(ref: React.RefObject<HTMLElement>, fn: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) fn(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, fn]);
}

function Notifications({ role, userId }: { role: Role; userId: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));
  const { items, update, bulkUpsert } = useCollection('notifications');
  const navigate = useNavigate();
  const mine = items.filter((n) => n.target === role || n.target === userId).sort((a, b) => b.date.localeCompare(a.date));
  const unread = mine.filter((n) => !n.read).length;
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="relative rounded-full p-2.5 text-navy-500 hover:bg-navy-50 hover:text-navy-800" aria-label={`Notifications (${unread} unread)`}>
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-navy-950">{unread}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="fixed inset-x-3 top-16 z-50 overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-lift sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-96">
            <div className="flex items-center justify-between border-b border-navy-50 px-4 py-3">
              <p className="font-semibold text-navy-900">Notifications</p>
              {unread > 0 && <button className="text-xs font-semibold text-navy-500 hover:text-navy-900" onClick={() => bulkUpsert(mine.map((n) => ({ ...n, read: true })))}>Mark all read</button>}
            </div>
            <ul className="scrollbar-thin max-h-96 overflow-y-auto">
              {mine.length === 0 && <li className="px-4 py-10 text-center text-sm text-navy-400">You're all caught up.</li>}
              {mine.map((n) => (
                <li key={n.id}>
                  <button onClick={() => { update(n.id, { read: true }); setOpen(false); if (n.link) navigate(n.link); }}
                    className={clsx('flex w-full gap-3 border-b border-navy-50 px-4 py-3 text-left transition hover:bg-ivory', !n.read && 'bg-gold-50/40')}>
                    <span className={clsx('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-navy-100' : 'bg-gold-500')} />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-navy-900">{n.title}</span>
                      <span className="block text-xs text-navy-500">{n.message}</span>
                      <span className="mt-1 block text-[11px] text-navy-400">{relativeDay(n.date)} · {fmtShort(n.date)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChildSwitcher() {
  const { children, student, setActiveStudentId, className } = useStudentContext();
  if (children.length < 2 || !student) return null;
  return (
    <div className="hidden items-center gap-2 rounded-full border border-navy-100 bg-white py-1 pl-1 pr-2 md:flex">
      <Avatar src={student.photo} name={student.name} size={28} />
      <select value={student.id} onChange={(e) => setActiveStudentId(e.target.value)} aria-label="Select child"
        className="bg-transparent text-sm font-medium text-navy-800 outline-none">
        {children.map((c) => <option key={c.id} value={c.id}>{c.name}{c.id === student.id ? ` · ${className}-${c.section}` : ''}</option>)}
      </select>
    </div>
  );
}

function ProfileMenu() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));
  const { children, setActiveStudentId, student } = useStudentContext();
  if (!user) return null;
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-navy-50" aria-label="Account menu">
        <Avatar src={user.avatar} name={user.name} size={34} />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-semibold text-navy-900">{user.name}</span>
          <span className="block text-[11px] capitalize text-navy-400">{user.role === 'office' ? 'Office Staff' : user.role}</span>
        </span>
        <ChevronDown className="hidden h-4 w-4 text-navy-400 sm:block" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-lift">
            <div className="border-b border-navy-50 px-4 py-3">
              <p className="font-semibold text-navy-900">{user.name}</p>
              <p className="text-xs text-navy-400">{user.email}</p>
            </div>
            {children.length > 1 && (
              <div className="border-b border-navy-50 p-2">
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-navy-400">Switch child</p>
                {children.map((c) => (
                  <button key={c.id} onClick={() => { setActiveStudentId(c.id); setOpen(false); toast.info(`Viewing ${c.name}`); }}
                    className={clsx('flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-navy-50', c.id === student?.id && 'bg-navy-50 font-semibold')}>
                    <Avatar src={c.photo} name={c.name} size={26} />{c.name}
                  </button>
                ))}
              </div>
            )}
            <div className="p-2">
              {user.role === 'parent' && <Link to="/fees" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-navy-700 hover:bg-navy-50"><ExternalLink className="h-4 w-4" />Open Fees Portal</Link>}
              {DATA_MODE === 'mock' && (
                <button onClick={() => { resetDemoData(); setOpen(false); toast.success('Demo data reset', 'All sample records were restored.'); }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-navy-700 hover:bg-navy-50"><RotateCcw className="h-4 w-4" />Reset demo data</button>
              )}
              <button onClick={() => { logout(); navigate('/login'); toast.success('Signed out', 'You have been logged out securely.'); }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" />Sign out</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DashboardLayout({ role }: { role: Role }) {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => { setMobileOpen(false); window.scrollTo(0, 0); }, [loc.pathname]);
  const current = [...NAV[role]].sort((a, b) => b.to.length - a.to.length).find((n) => loc.pathname.startsWith(n.to));

  return (
    <div className="min-h-screen bg-mist">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block"><Sidebar role={role} /></aside>
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div className="absolute inset-0 bg-navy-950/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
            <motion.div className="absolute inset-y-0 left-0 w-72" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.22 }}>
              <Sidebar role={role} onNavigate={() => setMobileOpen(false)} />
              <button onClick={() => setMobileOpen(false)} className="absolute -right-12 top-4 rounded-full bg-white p-2 text-navy-800" aria-label="Close menu"><X className="h-5 w-5" /></button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-navy-100/70 bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-navy-700 hover:bg-navy-50 lg:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-600">{PORTAL_NAME[role]}</p>
              <p className="truncate text-sm font-semibold text-navy-900">{current?.label ?? 'Dashboard'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            {role === 'parent' && <ChildSwitcher />}
            {user && <Notifications role={role} userId={user.id} />}
            <ProfileMenu />
          </div>
        </header>
        <AnimatePresence mode="wait">
          <motion.main key={loc.pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
            className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
