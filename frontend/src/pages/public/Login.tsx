import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import type { Role } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useForm, v } from '@/hooks/useForm';
import { DEMO_ACCOUNTS, ROLE_HOME } from '@/services/authService';
import { DEMO_PASSWORD } from '@/services/config';
import { Button, Field, Input } from '@/components/ui';
import { Logo } from '@/components/site/Logo';
import { img } from '@/data/images';
import { school } from '@/data/school';
import { PORTAL_NAME } from '@/routes/navigation';

const TABS: { role: Role; label: string }[] = [
  { role: 'parent', label: 'Parent' },
  { role: 'student', label: 'Student' },
  { role: 'teacher', label: 'Teacher' },
  { role: 'office', label: 'Office' },
  { role: 'admin', label: 'Admin' },
];

const BLURB: Record<Role, string> = {
  parent: 'Track attendance, homework, results, fees and your child\'s school bus.',
  student: 'Access study materials, video lectures and submit assignments.',
  teacher: 'Upload materials, create assignments, review work and mark attendance.',
  office: 'Manage students, fees, communication and transport operations.',
  admin: 'Complete control of school records, academics, fees and transport.',
};

const isRole = (r: string | null): r is Role => !!r && ['parent', 'student', 'teacher', 'office', 'admin'].includes(r);

export default function Login() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, login, logout } = useAuth();
  const initialRole = params.get('role');
  const [role, setRole] = useState<Role>(isRole(initialRole) ? initialRole : 'parent');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = params.get('next');

  const f = useForm({ email: '', password: '' }, {
    email: [v.required('Please enter your email'), v.email()],
    password: [v.required('Please enter your password'), v.minLength(6, 'Password must be at least 6 characters')],
  });

  useEffect(() => { setError(null); }, [role]);

  const target = (r: Role) => (next && next.startsWith(ROLE_HOME[r]) ? next : next === '/fees' && r === 'parent' ? '/fees' : ROLE_HOME[r]);

  const submit = f.handleSubmit(async (vals) => {
    setError(null);
    try {
      const u = await login(vals.email, vals.password, role);
      toast.success(`Welcome, ${u.name}`, `Signed in to the ${PORTAL_NAME[u.role]}.`);
      navigate(target(u.role), { replace: true });
    } catch (e) {
      setError((e as Error).message);
    }
  });

  const fillDemo = (r: Role, email: string) => {
    setRole(r);
    f.setValues({ email, password: DEMO_PASSWORD });
    setError(null);
  };

  return (
    <div className="flex min-h-screen bg-ivory">
      {/* Visual panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-navy-950 lg:block xl:w-[55%]">
        <img src={img.hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-br from-navy-950/95 via-navy-950/70 to-navy-900/40" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo light />
          <div>
            <p className="eyebrow text-gold-300">{PORTAL_NAME[role]}</p>
            <motion.h1 key={role} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 max-w-lg text-4xl font-semibold leading-tight text-white xl:text-5xl">
              One connected platform for our school community.
            </motion.h1>
            <p className="mt-5 max-w-md text-navy-200">{BLURB[role]}</p>
            <div className="mt-10 flex items-center gap-3 text-sm text-navy-300"><ShieldCheck className="h-5 w-5 text-gold-400" />Role-based secure access · Data visible only to authorised users</div>
          </div>
          <p className="text-xs text-navy-400">© {new Date().getFullYear()} {school.name}, {school.town}</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between px-6 py-5 lg:justify-end">
          <div className="lg:hidden"><Logo compact /></div>
          <Link to="/" className="btn-ghost"><ArrowLeft className="h-4 w-4" />Back to website</Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-12">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <h2 className="text-3xl font-semibold text-navy-900">Sign in</h2>
            <p className="mt-2 text-sm text-navy-500">Choose your portal and sign in with your school credentials.</p>

            {user && (
              <div className="mt-6 flex flex-col gap-3 rounded-xl border border-navy-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-navy-600">Signed in as <strong className="text-navy-900">{user.name}</strong></p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => navigate(ROLE_HOME[user.role])} icon={<ArrowRight className="h-3.5 w-3.5" />}>Continue to your dashboard</Button>
                  <Button size="sm" variant="outline" onClick={() => { logout(); toast.info('Signed out'); }}>Sign out</Button>
                </div>
              </div>
            )}

            <div className="mt-6 grid grid-cols-5 gap-1 rounded-xl bg-mist p-1" role="tablist" aria-label="Portal">
              {TABS.map((t) => (
                <button key={t.role} role="tab" aria-selected={role === t.role} onClick={() => setRole(t.role)}
                  className={clsx('rounded-lg py-2 text-[13px] font-medium transition', role === t.role ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-500 hover:text-navy-800')}>{t.label}</button>
              ))}
            </div>

            <form onSubmit={submit} noValidate className="mt-6 space-y-4">
              <Field label="Email address" error={f.errors.email}>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
                  <Input {...f.bind('email')} type="email" autoComplete="username" placeholder={`${role}@schooldemo.com`} className="pl-10" />
                </div>
              </Field>
              <Field label="Password" error={f.errors.password}>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
                  <Input {...f.bind('password')} type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" className="pl-10 pr-10" />
                  <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-700" aria-label={show ? 'Hide password' : 'Show password'}>
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
                </div>
              )}
              <Button type="submit" size="lg" className="w-full" loading={f.submitting}>Sign in to {PORTAL_NAME[role]}</Button>
              <p className="text-center text-xs text-navy-400">The Online Fees Portal uses the Parent login.</p>
            </form>

            <div className="mt-8 rounded-2xl border border-dashed border-gold-300 bg-gold-50/60 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-navy-900"><KeyRound className="h-4 w-4 text-gold-600" />Demo credentials</div>
              <p className="mt-1 text-xs text-navy-500">Password for all accounts: <code className="rounded bg-white px-1.5 py-0.5 font-semibold text-navy-800">{DEMO_PASSWORD}</code> · click to fill</p>
              <div className="mt-3 grid gap-1.5">
                {DEMO_ACCOUNTS.map((a) => (
                  <button key={a.role} type="button" onClick={() => fillDemo(a.role, a.email)}
                    className={clsx('flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-white', role === a.role && 'bg-white shadow-sm')}>
                    <span className="font-medium text-navy-800">{a.label}</span>
                    <span className="text-xs text-navy-500">{a.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
