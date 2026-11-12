import { useState } from 'react';
import { CheckCircle2, CircleDashed, Cloud, CreditCard, Database, KeyRound, Map, RotateCcw, Server, ShieldCheck, Copy } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { Badge, Button, ConfirmDialog, DemoBadge, PageHeader, Panel } from '@/components/ui';
import { DATA_MODE, DEMO_PASSWORD, GOOGLE_MAPS_KEY } from '@/services/config';
import { DEMO_ACCOUNTS, ROLE_HOME } from '@/services/authService';
import { resetDemoData } from '@/services/dataService';
import { DEMO_NOTICE, school } from '@/data/school';

function Integration({ icon: Icon, title, status, ok, desc }: { icon: typeof Map; title: string; status: string; ok: boolean; desc: string }) {
  return (
    <div className="card flex gap-4 p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700"><Icon className="h-5 w-5" /></span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-navy-900">{title}</p>
          <Badge tone={ok ? 'green' : 'amber'}>{ok ? <CheckCircle2 className="h-3 w-3" /> : <CircleDashed className="h-3 w-3" />}{status}</Badge>
        </div>
        <p className="mt-1 text-sm text-navy-500">{desc}</p>
      </div>
    </div>
  );
}

export default function Settings() {
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const copy = (t: string) => { navigator.clipboard?.writeText(t).then(() => toast.info('Copied', t), () => toast.error('Copy failed')); };
  return (
    <div>
      <PageHeader eyebrow="System" title="Settings" subtitle="Demo environment, integrations and access credentials" />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel title="Integrations" subtitle="Architecture is ready for production services">
            <div className="grid gap-4 md:grid-cols-2">
              <Integration icon={Database} title="Data source" ok status={DATA_MODE === 'api' ? 'REST API' : 'Browser demo DB'}
                desc={DATA_MODE === 'api' ? 'Connected to the Express backend via /api.' : 'Records are stored in this browser (localStorage). Set VITE_DATA_MODE=api to use the Node.js backend.'} />
              <Integration icon={Map} title="Google Maps" ok={!!GOOGLE_MAPS_KEY} status={GOOGLE_MAPS_KEY ? 'Configured' : 'Using OpenStreetMap'}
                desc={GOOGLE_MAPS_KEY ? 'Bus tracking renders on Google Maps.' : 'Add VITE_GOOGLE_MAPS_API_KEY to switch the tracker to Google Maps.'} />
              <Integration icon={CreditCard} title="Payment gateway" ok={false} status="Simulated"
                desc="Order → checkout → signature verification flow is in place. Add gateway credentials on the backend (e.g. Razorpay) to accept real payments." />
              <Integration icon={Cloud} title="Media storage" ok={false} status="Cloudinary-ready"
                desc="Gallery, circulars and study materials use demo files. Configure Cloudinary keys on the backend for uploads." />
              <Integration icon={Server} title="Backend API" ok={DATA_MODE === 'api'} status={DATA_MODE === 'api' ? 'Active' : 'Optional'}
                desc="Node.js + Express with JWT authentication and role-based access control (see /backend)." />
              <Integration icon={ShieldCheck} title="Role-based access" ok status="Enforced"
                desc="Admin, office, teacher, parent and student routes are guarded; cross-role access is redirected." />
            </div>
          </Panel>

          <Panel title="Demo login credentials" subtitle={<>Shared demo password: <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-navy-800">{DEMO_PASSWORD}</code></>} bodyClassName="p-0"
            action={<Button size="sm" variant="outline" icon={<Copy className="h-3.5 w-3.5" />} onClick={() => copy(DEMO_PASSWORD)}>Copy password</Button>}>
            <div className="scrollbar-thin overflow-x-auto">
              <table className="table-base">
                <thead><tr><th>Role</th><th>Email</th><th>Lands on</th><th /></tr></thead>
                <tbody>
                  {DEMO_ACCOUNTS.map((a) => (
                    <tr key={a.role}>
                      <td><Badge tone="navy">{a.label}</Badge></td>
                      <td className="font-mono text-xs">{a.email}</td>
                      <td className="text-navy-500">{ROLE_HOME[a.role]}</td>
                      <td className="text-right"><button className="btn-ghost btn-sm" onClick={() => copy(a.email)} aria-label={`Copy ${a.email}`}><Copy className="h-3.5 w-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="School profile" action={<DemoBadge />}>
            <dl className="space-y-3 text-sm">
              {[
                ['School', school.name], ['Location', `${school.town}, ${school.state}`], ['Address', `${school.address} – ${school.addressNote}`],
                ['Phone', school.phoneDisplay], ['Email', school.email], ['Academic year', school.academicYear], ['Principal', school.principal.name],
              ].map(([k, v]) => <div key={k}><dt className="text-xs font-semibold uppercase tracking-wide text-navy-400">{k}</dt><dd className="text-navy-800">{v}</dd></div>)}
            </dl>
            <p className="mt-4 rounded-xl border border-dashed border-gold-300 bg-gold-50 p-3 text-xs leading-relaxed text-gold-800">{DEMO_NOTICE}</p>
          </Panel>

          <Panel title="Demo data" subtitle="Restore the original sample records">
            <p className="text-sm text-navy-500">Resets students, fees, attendance, LMS content and all changes made during the demo.</p>
            <Button className="mt-4 w-full" variant="outline" icon={<RotateCcw className="h-4 w-4" />} disabled={DATA_MODE !== 'mock'} onClick={() => setConfirm(true)}>Reset demo data</Button>
            {DATA_MODE !== 'mock' && <p className="mt-2 flex items-center gap-1 text-xs text-navy-400"><KeyRound className="h-3 w-3" />Run <code>npm run seed</code> on the backend to reset API data.</p>}
          </Panel>
        </div>
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} title="Reset all demo data?" confirmLabel="Reset" message="Every change made in this browser will be discarded and the original sample data restored."
        onConfirm={() => { resetDemoData(); setConfirm(false); toast.success('Demo data reset', 'All sample records were restored.'); }} />
    </div>
  );
}
