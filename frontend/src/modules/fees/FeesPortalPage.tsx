import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, LogOut, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/site/Logo';
import { Avatar } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useStudentContext } from '@/hooks/useStudentContext';
import { DEMO_NOTICE } from '@/data/school';
import FeesOverview from './FeesOverview';

export default function FeesPortalPage() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { children, student, setActiveStudentId } = useStudentContext();

  return (
    <div className="min-h-screen bg-ivory">
      <header className="sticky top-0 z-30 border-b border-navy-100 bg-white/95 backdrop-blur">
        <div className="container flex h-[72px] items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="hidden h-8 w-px bg-navy-100 md:block" />
            <p className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-gold-600 md:block">Online Fees Portal</p>
          </div>
          <div className="flex items-center gap-2">
            {children.length > 1 && student && (
              <select value={student.id} onChange={(e) => setActiveStudentId(e.target.value)} aria-label="Select child"
                className="hidden rounded-lg border border-navy-100 bg-white px-3 py-2 text-sm font-medium text-navy-800 outline-none sm:block">
                {children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            {user && <div className="hidden items-center gap-2 lg:flex"><Avatar src={user.avatar} name={user.name} size={32} /><span className="text-sm font-semibold text-navy-900">{user.name}</span></div>}
            <button onClick={() => { logout(); toast.success('Signed out'); navigate('/login?role=parent&next=/fees'); }} className="btn-ghost btn-sm" aria-label="Sign out"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Sign out</span></button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Link to="/parent" className="btn-outline btn-sm"><ArrowLeft className="h-3.5 w-3.5" />Parent Portal</Link>
          <Link to="/" className="btn-ghost btn-sm"><Globe className="h-3.5 w-3.5" />School website</Link>
          {children.length > 1 && student && (
            <select value={student.id} onChange={(e) => setActiveStudentId(e.target.value)} aria-label="Select child" className="input w-auto py-1.5 sm:hidden">
              {children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>
        <FeesOverview standalone />
        <div className="mt-10 flex flex-col items-center gap-2 border-t border-navy-100 pt-6 text-center text-xs text-navy-400">
          <p className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-600" />Payments are simulated in this demo. A certified gateway (e.g. Razorpay / PayU) will be integrated for live use.</p>
          <p>{DEMO_NOTICE}</p>
        </div>
      </div>
    </div>
  );
}
