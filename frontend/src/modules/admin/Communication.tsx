import { useMemo, useState } from 'react';
import { CalendarDays, Download, FileText, MapPin, Megaphone, Pencil, Pin, Plus, Send, Trash2, Upload, Clock } from 'lucide-react';
import clsx from 'clsx';
import type { Announcement, AppNotification, Audience, Circular, SchoolEvent } from '@/types';
import { useCollection } from '@/hooks/useCollection';
import { useForm, v } from '@/hooks/useForm';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { Badge, Button, ConfirmDialog, DataTable, EmptyState, Field, Input, Modal, PageHeader, Panel, Select, Spinner, StatusBadge, Tabs, Textarea, type Column } from '@/components/ui';
import { fmtDate, parseISO, relativeDay, todayISO } from '@/utils/format';
import { downloadDemoDocument } from '@/utils/pdf';

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: 'all', label: 'Everyone' }, { value: 'parents', label: 'Parents' }, { value: 'students', label: 'Students' }, { value: 'teachers', label: 'Teachers' }, { value: 'staff', label: 'Office staff' },
];
const audLabel = (a: Audience) => AUDIENCES.find((x) => x.value === a)?.label ?? a;

// ---------------- Announcements ----------------
function Announcements() {
  const { items, loading, create, update, remove } = useCollection('announcements');
  const { user } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Announcement | null>(null);
  const [aud, setAud] = useState('');
  const form = useForm({ title: '', body: '', audience: 'all', priority: 'normal', pinned: '', author: '' }, { title: [v.required(), v.minLength(5)], body: [v.required(), v.minLength(10)], author: [v.required()] });
  const openForm = (a?: Announcement) => {
    setEditing(a ?? null);
    form.reset({ title: a?.title ?? '', body: a?.body ?? '', audience: a?.audience ?? 'all', priority: a?.priority ?? 'normal', pinned: a?.pinned ? 'yes' : '', author: a?.author ?? (user?.role === 'office' ? 'School Office' : 'Principal Office') });
    setOpen(true);
  };
  const save = form.handleSubmit(async (vals) => {
    const data = { title: vals.title.trim(), body: vals.body.trim(), audience: vals.audience as Audience, priority: vals.priority as 'normal' | 'high', pinned: vals.pinned === 'yes', author: vals.author.trim(), date: editing?.date ?? todayISO() };
    if (editing) await update(editing.id, data); else await create(data);
    toast.success(editing ? 'Announcement updated' : 'Announcement published', `Visible to ${audLabel(data.audience).toLowerCase()}.`);
    setOpen(false);
  });
  const rows = items.filter((a) => !aud || a.audience === aud).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.date.localeCompare(a.date));
  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select className="sm:w-44" value={aud} onChange={(e) => setAud(e.target.value)} placeholder="All audiences" options={AUDIENCES} aria-label="Audience" />
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => openForm()}>New announcement</Button>
      </div>
      {loading ? <Spinner /> : rows.length === 0 ? <div className="card"><EmptyState title="No announcements" /></div> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((a) => (
            <article key={a.id} className={clsx('card flex flex-col p-5', a.priority === 'high' && 'border-l-4 border-l-gold-500')}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {a.pinned && <Badge tone="gold"><Pin className="h-3 w-3" />Pinned</Badge>}
                  {a.priority === 'high' && <Badge tone="red">Important</Badge>}
                  <Badge tone="navy">{audLabel(a.audience)}</Badge>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button className="btn-ghost btn-sm" onClick={() => update(a.id, { pinned: !a.pinned }).then(() => toast.info(a.pinned ? 'Unpinned' : 'Pinned to top'))} aria-label={a.pinned ? 'Unpin' : 'Pin'}><Pin className={clsx('h-4 w-4', a.pinned && 'fill-gold-400 text-gold-600')} /></button>
                  <button className="btn-ghost btn-sm" onClick={() => openForm(a)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                  <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setDeleting(a)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <h3 className="mt-3 font-serif text-lg font-semibold text-navy-900">{a.title}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-navy-600">{a.body}</p>
              <p className="mt-4 text-xs text-navy-400">{a.author} · {fmtDate(a.date)}</p>
            </article>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} size="lg" title={editing ? 'Edit announcement' : 'New announcement'}
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button icon={<Send className="h-4 w-4" />} loading={form.submitting} onClick={() => save()}>{editing ? 'Save' : 'Publish'}</Button></>}>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" required error={form.errors.title} className="sm:col-span-2"><Input {...form.bind('title')} /></Field>
          <Field label="Message" required error={form.errors.body} className="sm:col-span-2"><Textarea rows={5} {...form.bind('body')} /></Field>
          <Field label="Audience"><Select {...form.bind('audience')} options={AUDIENCES} /></Field>
          <Field label="Priority"><Select {...form.bind('priority')} options={[{ value: 'normal', label: 'Normal' }, { value: 'high', label: 'Important' }]} /></Field>
          <Field label="Published by" required error={form.errors.author}><Input {...form.bind('author')} /></Field>
          <Field label="Pin to top"><Select {...form.bind('pinned')} options={[{ value: '', label: 'No' }, { value: 'yes', label: 'Yes' }]} /></Field>
          <button type="submit" hidden />
        </form>
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} title="Delete announcement?" message={`"${deleting?.title ?? ''}" will be removed for all users.`}
        onConfirm={async () => { if (deleting) { await remove(deleting.id); toast.success('Announcement deleted'); setDeleting(null); } }} />
    </>
  );
}

// ---------------- Notifications ----------------
const TARGETS = [{ value: 'parent', label: 'All parents' }, { value: 'student', label: 'All students' }, { value: 'teacher', label: 'All teachers' }, { value: 'office', label: 'Office staff' }, { value: 'admin', label: 'Administrators' }];
const TYPES: { value: AppNotification['type']; label: string }[] = [{ value: 'info', label: 'General' }, { value: 'fee', label: 'Fees' }, { value: 'exam', label: 'Examination' }, { value: 'homework', label: 'Homework' }, { value: 'transport', label: 'Transport' }, { value: 'event', label: 'Event' }];
const LINKS: Record<string, string> = { parent: '/parent/messages', student: '/student', teacher: '/teacher', office: '/office', admin: '/admin' };

function Notifications() {
  const { items, loading, create, remove } = useCollection('notifications');
  const toast = useToast();
  const form = useForm({ targets: ['parent'] as string[], type: 'info', title: '', message: '' }, { targets: [v.required('Choose at least one recipient group')], title: [v.required()], message: [v.required(), v.minLength(5)] });
  const send = form.handleSubmit(async (vals) => {
    for (const t of vals.targets) {
      await create({ target: t, title: vals.title.trim(), message: vals.message.trim(), type: vals.type as AppNotification['type'], date: todayISO(), read: false, link: vals.type === 'fee' && t === 'parent' ? '/fees' : LINKS[t] });
    }
    toast.success('Notification sent', `Delivered to ${vals.targets.map((t) => TARGETS.find((x) => x.value === t)?.label.toLowerCase()).join(', ')}.`);
    form.reset({ ...vals, title: '', message: '' });
  });
  const cols: Column<AppNotification>[] = [
    { key: 'title', header: 'Notification', render: (n) => <div><p className="font-medium text-navy-900">{n.title}</p><p className="line-clamp-1 text-xs text-navy-400">{n.message}</p></div>, value: (n) => `${n.title} ${n.message}` },
    { key: 'target', header: 'Sent to', render: (n) => <Badge tone="navy">{TARGETS.find((t) => t.value === n.target)?.label ?? 'Individual user'}</Badge> },
    { key: 'type', header: 'Type', render: (n) => <Badge tone="grey">{TYPES.find((t) => t.value === n.type)?.label}</Badge> },
    { key: 'date', header: 'Date', render: (n) => relativeDay(n.date) },
    { key: 'read', header: 'Status', render: (n) => <StatusBadge status={n.read ? 'Read' : 'Delivered'} /> },
  ];
  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <Panel title="Compose notification" subtitle="Appears instantly in the bell menu of the selected portals" className="xl:col-span-2">
        <form onSubmit={send} className="space-y-4">
          <Field label="Recipients" required error={form.errors.targets}>
            <div className="flex flex-wrap gap-1.5">
              {TARGETS.map((t) => {
                const on = form.values.targets.includes(t.value);
                return <button type="button" key={t.value} aria-pressed={on} onClick={() => form.set('targets', on ? form.values.targets.filter((x) => x !== t.value) : [...form.values.targets, t.value])}
                  className={clsx('rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset', on ? 'bg-navy-900 text-white ring-navy-900' : 'bg-white text-navy-600 ring-navy-100')}>{t.label}</button>;
              })}
            </div>
          </Field>
          <Field label="Category"><Select {...form.bind('type')} options={TYPES} /></Field>
          <Field label="Title" required error={form.errors.title}><Input {...form.bind('title')} placeholder="e.g. School closed tomorrow" /></Field>
          <Field label="Message" required error={form.errors.message}><Textarea rows={4} {...form.bind('message')} /></Field>
          <Button type="submit" className="w-full" icon={<Send className="h-4 w-4" />} loading={form.submitting}>Send notification</Button>
        </form>
      </Panel>
      <div className="xl:col-span-3">
        <DataTable rows={[...items].sort((a, b) => b.date.localeCompare(a.date))} columns={cols} loading={loading} pageSize={8} searchPlaceholder="Search sent notifications…"
          actions={(n) => <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => remove(n.id).then(() => toast.success('Notification withdrawn'))} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>} />
      </div>
    </div>
  );
}

// ---------------- Circulars ----------------
function Circulars() {
  const { items, loading, create, update, remove } = useCollection('circulars');
  const toast = useToast();
  const [editing, setEditing] = useState<Circular | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Circular | null>(null);
  const form = useForm({ title: '', refNo: '', date: todayISO(), description: '', fileName: '', audience: 'all' }, {
    title: [v.required()], refNo: [v.required()], date: [v.required()], description: [v.required()], fileName: [v.required('Attach the circular document')],
  });
  const openForm = (c?: Circular) => {
    setEditing(c ?? null);
    const n = Math.max(0, ...items.map((x) => Number(x.refNo.split('/').pop()) || 0)) + 1;
    form.reset({ title: c?.title ?? '', refNo: c?.refNo ?? `SPS/CIR/${new Date().getFullYear()}/${String(n).padStart(3, '0')}`, date: c?.date ?? todayISO(), description: c?.description ?? '', fileName: c?.fileName ?? '', audience: c?.audience ?? 'all' });
    setOpen(true);
  };
  const save = form.handleSubmit(async (vals) => {
    const data = { ...vals, audience: vals.audience as Audience };
    if (editing) await update(editing.id, data); else await create(data);
    toast.success(editing ? 'Circular updated' : 'Circular uploaded', data.title);
    setOpen(false);
  });
  const download = (c: Circular) => {
    downloadDemoDocument(c.title, [`Ref: ${c.refNo}    Date: ${fmtDate(c.date)}`, `To: ${audLabel(c.audience)}`, c.description, 'This is a demo copy generated by the portal. In production the uploaded file is served from media storage (e.g. Cloudinary / S3).'], c.fileName);
    toast.success('Download started', c.fileName);
  };
  const cols: Column<Circular>[] = [
    { key: 'title', header: 'Circular', value: (c) => `${c.title} ${c.refNo}`, render: (c) => <div className="flex items-start gap-3"><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600"><FileText className="h-4 w-4" /></span><div><p className="font-medium text-navy-900">{c.title}</p><p className="text-xs text-navy-400">{c.refNo} · {c.fileName}</p></div></div> },
    { key: 'audience', header: 'Audience', render: (c) => <Badge tone="navy">{audLabel(c.audience)}</Badge> },
    { key: 'date', header: 'Date', render: (c) => fmtDate(c.date) },
  ];
  return (
    <>
      <div className="mb-4 flex justify-end"><Button icon={<Upload className="h-4 w-4" />} onClick={() => openForm()}>Upload circular</Button></div>
      <DataTable rows={[...items].sort((a, b) => b.date.localeCompare(a.date))} columns={cols} loading={loading}
        actions={(c) => <>
          <button className="btn-ghost btn-sm" onClick={() => download(c)} aria-label="Download"><Download className="h-4 w-4" /></button>
          <button className="btn-ghost btn-sm" onClick={() => openForm(c)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
          <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setDeleting(c)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
        </>} />
      <Modal open={open} onClose={() => setOpen(false)} size="lg" title={editing ? 'Edit circular' : 'Upload circular'}
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button loading={form.submitting} onClick={() => save()}>Save</Button></>}>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" required error={form.errors.title} className="sm:col-span-2"><Input {...form.bind('title')} /></Field>
          <Field label="Reference no." required error={form.errors.refNo}><Input {...form.bind('refNo')} /></Field>
          <Field label="Date" required error={form.errors.date}><Input type="date" {...form.bind('date')} /></Field>
          <Field label="Audience"><Select {...form.bind('audience')} options={AUDIENCES} /></Field>
          <Field label="Document (PDF)" required error={form.errors.fileName} hint={form.values.fileName ? `Selected: ${form.values.fileName}` : 'Demo: only the file name is stored'}>
            <label className={clsx('input flex cursor-pointer items-center gap-2', form.errors.fileName && 'input-error')}>
              <Upload className="h-4 w-4 text-navy-400" /><span className="truncate text-navy-500">{form.values.fileName || 'Choose file…'}</span>
              <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) form.set('fileName', f.name); }} />
            </label>
          </Field>
          <Field label="Summary" required error={form.errors.description} className="sm:col-span-2"><Textarea rows={3} {...form.bind('description')} /></Field>
          <button type="submit" hidden />
        </form>
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} title="Delete circular?" message={`${deleting?.refNo ?? ''} will no longer be available to parents.`}
        onConfirm={async () => { if (deleting) { await remove(deleting.id); toast.success('Circular deleted'); setDeleting(null); } }} />
    </>
  );
}

// ---------------- Events ----------------
const CATS: SchoolEvent['category'][] = ['Academic', 'Sports', 'Cultural', 'Meeting', 'Holiday'];
const catTone = { Academic: 'navy', Sports: 'green', Cultural: 'gold', Meeting: 'blue', Holiday: 'red' } as const;
function Events() {
  const { items, loading, create, update, remove } = useCollection('events');
  const toast = useToast();
  const [editing, setEditing] = useState<SchoolEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<SchoolEvent | null>(null);
  const [showPast, setShowPast] = useState(false);
  const form = useForm({ title: '', date: '', time: '', venue: '', description: '', category: 'Academic' }, { title: [v.required()], date: [v.required()], time: [v.required()], venue: [v.required()] });
  const openForm = (e?: SchoolEvent) => { setEditing(e ?? null); form.reset({ title: e?.title ?? '', date: e?.date ?? '', time: e?.time ?? '', venue: e?.venue ?? '', description: e?.description ?? '', category: e?.category ?? 'Academic' }); setOpen(true); };
  const save = form.handleSubmit(async (vals) => {
    const data = { ...vals, category: vals.category as SchoolEvent['category'] };
    if (editing) await update(editing.id, data); else await create(data);
    toast.success(editing ? 'Event updated' : 'Event added', `${data.title} · ${fmtDate(data.date)}`);
    setOpen(false);
  });
  const today = todayISO();
  const grouped = useMemo(() => {
    const list = items.filter((e) => showPast || e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
    const g = new Map<string, SchoolEvent[]>();
    list.forEach((e) => { const k = e.date.slice(0, 7); g.set(k, [...(g.get(k) ?? []), e]); });
    return [...g.entries()];
  }, [items, showPast, today]);
  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm text-navy-600"><input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} className="h-4 w-4 accent-navy-900" />Show past events</label>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => openForm()}>Add event</Button>
      </div>
      {loading ? <Spinner /> : grouped.length === 0 ? <div className="card"><EmptyState title="No upcoming events" icon={<CalendarDays className="h-6 w-6" />} /></div> : (
        <div className="space-y-6">
          {grouped.map(([month, evs]) => (
            <section key={month}>
              <h3 className="mb-3 font-serif text-lg font-semibold text-navy-900">{parseISO(`${month}-01`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h3>
              <div className="space-y-3">
                {evs.map((e) => {
                  const d = parseISO(e.date);
                  return (
                    <div key={e.id} className={clsx('card flex flex-col gap-4 p-4 sm:flex-row sm:items-center', e.date < today && 'opacity-60')}>
                      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-navy-950 text-white">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gold-300">{d.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                        <span className="font-serif text-2xl font-semibold leading-none">{d.getDate()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-navy-900">{e.title}</p><Badge tone={catTone[e.category]}>{e.category}</Badge><span className="text-xs text-navy-400">{relativeDay(e.date)}</span></div>
                        <p className="mt-1 text-sm text-navy-500">{e.description}</p>
                        <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-navy-400"><span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{e.time}</span><span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{e.venue}</span></p>
                      </div>
                      <div className="flex gap-1 self-end sm:self-center">
                        <button className="btn-ghost btn-sm" onClick={() => openForm(e)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                        <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setDeleting(e)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} size="lg" title={editing ? 'Edit event' : 'Add event'}
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button loading={form.submitting} onClick={() => save()}>Save event</Button></>}>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="Event title" required error={form.errors.title} className="sm:col-span-2"><Input {...form.bind('title')} /></Field>
          <Field label="Date" required error={form.errors.date}><Input type="date" {...form.bind('date')} /></Field>
          <Field label="Time" required error={form.errors.time}><Input {...form.bind('time')} placeholder="e.g. 10:00 AM" /></Field>
          <Field label="Venue" required error={form.errors.venue}><Input {...form.bind('venue')} /></Field>
          <Field label="Category"><Select {...form.bind('category')} options={CATS.map((c) => ({ value: c, label: c }))} /></Field>
          <Field label="Description" className="sm:col-span-2"><Textarea rows={3} {...form.bind('description')} /></Field>
          <button type="submit" hidden />
        </form>
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} title="Delete event?" message={`${deleting?.title ?? ''} will be removed from the school calendar.`}
        onConfirm={async () => { if (deleting) { await remove(deleting.id); toast.success('Event deleted'); setDeleting(null); } }} />
    </>
  );
}

type Tab = 'announcements' | 'notifications' | 'circulars' | 'events';
export default function Communication() {
  const [tab, setTab] = useState<Tab>('announcements');
  return (
    <div>
      <PageHeader eyebrow="Communication" title="Communication Centre" subtitle="Announcements, push notifications, circulars and the school events calendar"
        actions={<Badge tone="gold"><Megaphone className="h-3.5 w-3.5" />Reaches all portals instantly</Badge>} />
      <Tabs className="mb-5 w-fit max-w-full" value={tab} onChange={setTab} tabs={[
        { value: 'announcements', label: 'Announcements' }, { value: 'notifications', label: 'Notifications' }, { value: 'circulars', label: 'Circulars' }, { value: 'events', label: 'Events' },
      ]} />
      {tab === 'announcements' && <Announcements />}
      {tab === 'notifications' && <Notifications />}
      {tab === 'circulars' && <Circulars />}
      {tab === 'events' && <Events />}
    </div>
  );
}
