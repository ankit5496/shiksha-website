import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Facebook, Instagram, Mail, MapPin, Menu, Phone, Wallet, X, Youtube, LogIn } from 'lucide-react';
import clsx from 'clsx';
import { school, DEMO_NOTICE } from '@/data/school';
import { Logo } from './Logo';

export const PUBLIC_NAV = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/academics', label: 'Academics' },
  { to: '/admissions', label: 'Admissions' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 12);
    h(); window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <header className={clsx('sticky top-0 z-50 border-b transition-all', scrolled ? 'border-navy-100 bg-white/95 shadow-soft backdrop-blur' : 'border-transparent bg-white')}>
      <div className="container flex h-[72px] items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {PUBLIC_NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}
              className={({ isActive }) => clsx('relative rounded-lg px-3.5 py-2 text-[14px] font-medium transition', isActive ? 'text-navy-900' : 'text-navy-500 hover:text-navy-900')}>
              {({ isActive }) => (<>{n.label}{isActive && <motion.span layoutId="nav-underline" className="absolute inset-x-3 -bottom-[1px] h-0.5 rounded-full bg-gold-500" />}</>)}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {/* transparent borders keep all three buttons the same height as the bordered Staff Login */}
          <Link to="/fees" className="btn-ghost border border-transparent"><Wallet className="h-4 w-4" />Pay Fees</Link>
          <Link to="/login?role=office" className="btn-outline"><LogIn className="h-4 w-4" />Staff Login</Link>
          <Link to="/admissions#enquiry" className="btn-gold border border-transparent">Apply for Admission</Link>
        </div>
        <button className="rounded-lg p-2 text-navy-800 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-6 w-6" /></button>
      </div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <motion.div className="absolute inset-0 bg-navy-950/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.25 }}
              className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-white shadow-lift">
              <div className="flex h-[72px] items-center justify-between border-b border-navy-50 px-5">
                <Logo compact />
                <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-lg p-2"><X className="h-6 w-6" /></button>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-4">
                {PUBLIC_NAV.map((n) => (
                  <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => clsx('block rounded-lg px-4 py-3 font-medium', isActive ? 'bg-navy-50 text-navy-900' : 'text-navy-600')}>{n.label}</NavLink>
                ))}
              </nav>
              <div className="grid gap-2 border-t border-navy-50 p-4">
                <Link to="/admissions#enquiry" className="btn-gold">Apply for Admission</Link>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/fees" className="btn-outline"><Wallet className="h-4 w-4" />Pay Fees</Link>
                  <Link to="/login?role=office" className="btn-outline"><LogIn className="h-4 w-4" />Staff Login</Link>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-navy-950 text-navy-200">
      <div className="container grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Logo light />
          <p className="mt-5 text-sm leading-relaxed text-navy-300">{school.tagline} A nurturing learning community in {school.town}, {school.state}.</p>
          <div className="mt-5 flex gap-2">
            {[Facebook, Instagram, Youtube].map((I, i) => (
              <a key={i} href="#" onClick={(e) => e.preventDefault()} aria-label="Social link (to be configured)" className="flex h-9 w-9 items-center justify-center rounded-full border border-navy-700 text-navy-300 transition hover:border-gold-400 hover:text-gold-300"><I className="h-4 w-4" /></a>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Explore</p>
          <ul className="space-y-2.5 text-sm">
            {PUBLIC_NAV.slice(1).map((n) => <li key={n.to}><Link to={n.to} className="hover:text-gold-300">{n.label}</Link></li>)}
          </ul>
        </div>
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Portals</p>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/login?role=parent" className="hover:text-gold-300">Parent Portal</Link></li>
            <li><Link to="/login?role=student" className="hover:text-gold-300">Student LMS</Link></li>
            <li><Link to="/login?role=teacher" className="hover:text-gold-300">Teacher LMS</Link></li>
            <li><Link to="/fees" className="hover:text-gold-300">Online Fees Portal</Link></li>
            <li><Link to="/login?role=office" className="hover:text-gold-300">Office / Admin Login</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Contact</p>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" /><span>{school.address}<br /><span className="text-xs text-navy-400">{school.addressNote}</span></span></li>
            <li className="flex gap-2.5"><Phone className="h-4 w-4 shrink-0 text-gold-400" />{school.phoneDisplay}</li>
            <li className="flex gap-2.5"><Mail className="h-4 w-4 shrink-0 text-gold-400" />{school.email}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-navy-800">
        <div className="container flex flex-col gap-2 py-5 text-xs text-navy-400 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {school.name}, {school.town}. All rights reserved.</p>
          <p className="max-w-xl md:text-right">{DEMO_NOTICE}</p>
        </div>
      </div>
    </footer>
  );
}

export function SectionHeading({ eyebrow, title, subtitle, center, light }: { eyebrow?: string; title: string; subtitle?: string; center?: boolean; light?: boolean }) {
  return (
    <div className={clsx('max-w-2xl', center && 'mx-auto text-center')}>
      {eyebrow && <p className={clsx('eyebrow', light && 'text-gold-300')}>{eyebrow}</p>}
      <h2 className={clsx('mt-3 text-balance text-3xl font-semibold sm:text-4xl', light ? 'text-white' : 'text-navy-900')}>{title}</h2>
      {subtitle && <p className={clsx('mt-4 text-[15px] leading-relaxed', light ? 'text-navy-200' : 'text-navy-500')}>{subtitle}</p>}
    </div>
  );
}

/** Inner-page hero banner. */
export function PageHero({ title, subtitle, image, crumbs }: { title: string; subtitle?: string; image: string; crumbs?: string }) {
  return (
    <section className="relative isolate overflow-hidden bg-navy-950">
      <img src={image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/85 to-navy-950/40" />
      <div className="container py-20 sm:py-24">
        <p className="eyebrow text-gold-300">{crumbs ?? 'Home'}</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold text-white sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-navy-200">{subtitle}</p>}
      </div>
    </section>
  );
}

/** Fade-up on scroll wrapper. */
export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5, delay }}>
      {children}
    </motion.div>
  );
}
