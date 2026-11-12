import { useMemo, useState } from 'react';
import { Download, FileText, Megaphone, Pin, Search } from 'lucide-react';
import { Badge, Button, EmptyState, PageHeader, Spinner, Tabs } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useCollection } from '@/hooks/useCollection';
import { fmtDate, relativeDay } from '@/utils/format';
import { downloadDemoDocument } from '@/utils/pdf';
import { school } from '@/data/school';
import { visibleTo } from './helpers';

type Tab = 'announcements' | 'circulars';

export default function Notices() {
  const { user } = useAuth();
  const toast = useToast();
  const { items: announcements, loading: al } = useCollection('announcements');
  const { items: circulars, loading: cl } = useCollection('circulars');
  const [tab, setTab] = useState<Tab>('announcements');
  const [q, setQ] = useState('');

  const ann = useMemo(() => announcements.filter(visibleTo(user?.role))
    .filter((a) => `${a.title} ${a.body}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.date.localeCompare(a.date)), [announcements, user, q]);
  const circ = useMemo(() => circulars.filter(visibleTo(user?.role))
    .filter((c) => `${c.title} ${c.description} ${c.refNo}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date)), [circulars, user, q]);

  if (al || cl) return <Spinner />;

  return (
    <div>
      <PageHeader eyebrow="Communication" title="Notices & Circulars" subtitle="Official announcements and circulars from the school." />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onChange={setTab} tabs={[{ value: 'announcements', label: 'Announcements', count: ann.length }, { value: 'circulars', label: 'Circulars', count: circ.length }]} />
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
          <input className="input pl-9" placeholder="Search notices…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search notices" />
        </div>
      </div>

      {tab === 'announcements' && (ann.length === 0 ? <div className="card"><EmptyState icon={<Megaphone className="h-6 w-6" />} title="No announcements" /></div> : (
        <div className="space-y-3">
          {ann.map((a) => (
            <article key={a.id} className="card p-5">
              <div className="flex flex-wrap items-center gap-2">
                {a.pinned && <Badge tone="gold"><Pin className="h-3 w-3" />Pinned</Badge>}
                {a.priority === 'high' && <Badge tone="red">Important</Badge>}
                <Badge tone="grey" className="capitalize">{a.audience === 'all' ? 'Everyone' : a.audience}</Badge>
                <span className="ml-auto text-xs text-navy-400">{fmtDate(a.date)} · {relativeDay(a.date)}</span>
              </div>
              <h3 className="mt-3 font-sans text-base font-semibold text-navy-900">{a.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-navy-600">{a.body}</p>
              <p className="mt-3 text-xs font-medium text-navy-400">— {a.author}</p>
            </article>
          ))}
        </div>
      ))}

      {tab === 'circulars' && (circ.length === 0 ? <div className="card"><EmptyState icon={<FileText className="h-6 w-6" />} title="No circulars" /></div> : (
        <div className="card divide-y divide-navy-50">
          {circ.map((c) => (
            <div key={c.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"><FileText className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-navy-900">{c.title}</p>
                <p className="text-sm text-navy-500">{c.description}</p>
                <p className="mt-1 text-xs text-navy-400">Ref. {c.refNo} · {fmtDate(c.date)} · {c.fileName}</p>
              </div>
              <Button variant="outline" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={() => {
                downloadDemoDocument(c.title, [
                  `Ref. No.: ${c.refNo}`, `Date: ${fmtDate(c.date)}`, 'Dear Parents / Students,', c.description,
                  'Please read this circular carefully and contact the school office for any clarification.', `Principal, ${school.name}, ${school.town}`,
                ], c.fileName);
                toast.success('Circular downloaded', c.fileName);
              }}>Download</Button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
