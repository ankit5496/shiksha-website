import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Mail, Phone, Trash2, UserPlus, Inbox, GraduationCap, MessageSquare } from 'lucide-react';
import type { Enquiry } from '@/types';
import { useCollection } from '@/hooks/useCollection';
import { useToast } from '@/context/ToastContext';
import { Badge, Button, ConfirmDialog, DataTable, Modal, PageHeader, Select, StatCard, StatusBadge, Tabs, type Column } from '@/components/ui';
import { fmtDate, relativeDay } from '@/utils/format';
import { useClasses, useStaff } from './_shared';

export default function Enquiries() {
  const { items, loading, update, remove } = useCollection('enquiries');
  const { classes } = useClasses();
  const { base } = useStaff();
  const toast = useToast();
  const navigate = useNavigate();
  const [kind, setKind] = useState<'all' | 'admission' | 'contact'>('all');
  const [status, setStatus] = useState('');
  const [viewing, setViewing] = useState<Enquiry | null>(null);
  const [deleting, setDeleting] = useState<Enquiry | null>(null);

  const rows = items.filter((e) => (kind === 'all' || e.kind === kind) && (!status || e.status === status)).sort((a, b) => b.date.localeCompare(a.date));

  const setSt = async (e: Enquiry, s: Enquiry['status']) => {
    await update(e.id, { status: s });
    if (viewing?.id === e.id) setViewing({ ...e, status: s });
    toast.success('Status updated', `${e.name} marked as ${s}.`);
  };

  const convert = (e: Enquiry) => {
    const cls = classes.find((c) => c.name.toLowerCase() === (e.classApplying ?? '').toLowerCase());
    if (e.status === 'New') update(e.id, { status: 'Contacted' });
    navigate(`${base}/students`, { state: { prefill: { fatherName: e.name, phone: e.phone, email: e.email, classId: cls?.id ?? '', section: cls?.sections[0] ?? 'A' } } });
  };

  const columns: Column<Enquiry>[] = [
    { key: 'name', header: 'Name', render: (e) => <div><p className="font-semibold text-navy-900">{e.name}</p><p className="text-xs text-navy-400">{e.email}</p></div>, value: (e) => `${e.name} ${e.email}` },
    { key: 'kind', header: 'Type', render: (e) => <Badge tone={e.kind === 'admission' ? 'gold' : 'navy'}>{e.kind === 'admission' ? 'Admission' : 'Contact'}</Badge> },
    { key: 'about', header: 'Regarding', value: (e) => e.classApplying ?? e.subject ?? '', render: (e) => e.classApplying ? `Class: ${e.classApplying}` : e.subject ?? '—' },
    { key: 'phone', header: 'Phone' },
    { key: 'date', header: 'Received', render: (e) => <span title={fmtDate(e.date)}>{relativeDay(e.date)}</span> },
    { key: 'status', header: 'Status', render: (e) => <StatusBadge status={e.status} /> },
  ];

  return (
    <div>
      <PageHeader eyebrow="Front Office" title="Enquiries" subtitle="Admission and contact enquiries submitted through the website" />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="New enquiries" value={items.filter((e) => e.status === 'New').length} icon={<Inbox className="h-5 w-5" />} tone="gold" />
        <StatCard label="Admission enquiries" value={items.filter((e) => e.kind === 'admission').length} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard label="General enquiries" value={items.filter((e) => e.kind === 'contact').length} icon={<MessageSquare className="h-5 w-5" />} tone="blue" />
      </div>
      <Tabs className="mb-4 w-fit" value={kind} onChange={setKind} tabs={[
        { value: 'all', label: 'All', count: items.length },
        { value: 'admission', label: 'Admission', count: items.filter((e) => e.kind === 'admission').length },
        { value: 'contact', label: 'Contact', count: items.filter((e) => e.kind === 'contact').length },
      ]} />
      <DataTable rows={rows} columns={columns} loading={loading} onRowClick={setViewing} emptyTitle="No enquiries"
        toolbar={<Select className="w-36" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Any status" options={['New', 'Contacted', 'Closed'].map((s) => ({ value: s, label: s }))} aria-label="Filter status" />}
        actions={(e) => <>
          <button className="btn-ghost btn-sm" onClick={() => setViewing(e)} aria-label="View"><Eye className="h-4 w-4" /></button>
          {e.kind === 'admission' && <button className="btn-ghost btn-sm" onClick={() => convert(e)} aria-label="Convert to admission" title="Convert to admission"><UserPlus className="h-4 w-4" /></button>}
          <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setDeleting(e)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
        </>} />

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.name ?? ''} subtitle={viewing ? `${viewing.kind === 'admission' ? 'Admission' : 'Contact'} enquiry · ${fmtDate(viewing.date)}` : ''}
        footer={viewing && <>
          <Select className="w-40" value={viewing.status} onChange={(ev) => setSt(viewing, ev.target.value as Enquiry['status'])} options={['New', 'Contacted', 'Closed'].map((s) => ({ value: s, label: s }))} aria-label="Status" />
          {viewing.kind === 'admission' && <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => convert(viewing)}>Convert to admission</Button>}
        </>}>
        {viewing && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <a href={`tel:${viewing.phone}`} className="flex items-center gap-2 rounded-xl bg-mist p-3 text-sm hover:bg-navy-50"><Phone className="h-4 w-4 text-navy-400" />{viewing.phone}</a>
              <a href={`mailto:${viewing.email}`} className="flex items-center gap-2 rounded-xl bg-mist p-3 text-sm hover:bg-navy-50"><Mail className="h-4 w-4 text-navy-400" />{viewing.email}</a>
            </div>
            {viewing.classApplying && <p className="text-sm"><span className="label inline">Class applying for: </span>{viewing.classApplying}</p>}
            {viewing.subject && <p className="text-sm"><span className="label inline">Subject: </span>{viewing.subject}</p>}
            <div><p className="label">Message</p><p className="rounded-xl border border-navy-100 p-4 text-sm leading-relaxed text-navy-700">{viewing.message}</p></div>
            <div className="flex items-center gap-2 text-sm">Current status: <StatusBadge status={viewing.status} /></div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} title="Delete enquiry?" message={`The enquiry from ${deleting?.name ?? ''} will be removed.`}
        onConfirm={async () => { if (deleting) { await remove(deleting.id); toast.success('Enquiry deleted'); setDeleting(null); setViewing(null); } }} />
    </div>
  );
}
