import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Bell, BookOpen, Bus, CalendarDays, CheckCheck, GraduationCap, Info, PenSquare, Send, Trash2, Wallet } from 'lucide-react';
import type { AppNotification } from '@/types';
import { Button, EmptyState, Field, Input, Modal, PageHeader, Select, Spinner, Tabs, Textarea } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useCollection } from '@/hooks/useCollection';
import { useForm, v } from '@/hooks/useForm';
import { useStudentContext } from '@/hooks/useStudentContext';
import { fmtDate, relativeDay, todayISO } from '@/utils/format';

const TYPE_META: Record<AppNotification['type'], { icon: typeof Bell; cls: string; label: string }> = {
  info: { icon: Info, cls: 'bg-navy-50 text-navy-600', label: 'General' },
  fee: { icon: Wallet, cls: 'bg-gold-50 text-gold-700', label: 'Fees' },
  exam: { icon: GraduationCap, cls: 'bg-violet-50 text-violet-700', label: 'Exams' },
  transport: { icon: Bus, cls: 'bg-sky-50 text-sky-700', label: 'Transport' },
  homework: { icon: BookOpen, cls: 'bg-emerald-50 text-emerald-700', label: 'Homework' },
  event: { icon: CalendarDays, cls: 'bg-rose-50 text-rose-700', label: 'Events' },
};

export default function Messages() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { student, classRoom } = useStudentContext();
  const { items, loading, update, remove, bulkUpsert, create } = useCollection('notifications');
  const { items: teachers } = useCollection('teachers');
  const [type, setType] = useState<'all' | 'unread' | AppNotification['type']>('all');
  const [compose, setCompose] = useState(false);

  const mine = useMemo(() => items.filter((n) => n.target === user?.role || n.target === user?.id).sort((a, b) => b.date.localeCompare(a.date)), [items, user]);
  const shown = mine.filter((n) => (type === 'all' ? true : type === 'unread' ? !n.read : n.type === type));
  const unread = mine.filter((n) => !n.read).length;
  const classTeacher = teachers.find((t) => t.id === classRoom?.classTeacherId);
  const recipients = [
    ...(classTeacher ? [{ value: classTeacher.name, label: `${classTeacher.name} (Class teacher)` }] : []),
    { value: 'School Office', label: 'School Office' },
    { value: 'Accounts Office', label: 'Accounts Office' },
    { value: 'Transport In-charge', label: 'Transport In-charge' },
  ];

  const f = useForm({ to: '', subject: '', message: '' }, {
    to: [v.required('Choose a recipient')],
    subject: [v.required(), v.minLength(4)],
    message: [v.required(), v.minLength(10, 'Message must be at least 10 characters')],
  });

  const send = f.handleSubmit(async (vals) => {
    await new Promise((r) => setTimeout(r, 500));
    await create({ target: user!.id, title: `Message sent to ${vals.to}`, message: `“${vals.subject}” – ${vals.message.slice(0, 90)}${vals.message.length > 90 ? '…' : ''}`, date: todayISO(), read: true, type: 'info' });
    toast.success('Message sent', `${vals.to} will respond via the portal or phone.`);
    setCompose(false);
    f.reset();
  });

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader eyebrow="Communication" title="Notifications & Messages" subtitle="Alerts from the school and your sent messages."
        actions={<>
          {unread > 0 && <Button variant="outline" icon={<CheckCheck className="h-4 w-4" />} onClick={() => { bulkUpsert(mine.map((n) => ({ ...n, read: true }))); toast.success('All notifications marked as read'); }}>Mark all read</Button>}
          <Button icon={<PenSquare className="h-4 w-4" />} onClick={() => { f.reset({ to: recipients[0]?.value ?? '', subject: '', message: '' }); setCompose(true); }}>Message class teacher</Button>
        </>} />
      <Tabs className="mb-5" value={type} onChange={setType} tabs={[
        { value: 'all', label: 'All', count: mine.length }, { value: 'unread', label: 'Unread', count: unread },
        ...(['fee', 'exam', 'homework', 'transport', 'event', 'info'] as const).map((t) => ({ value: t, label: TYPE_META[t].label })),
      ]} />
      {shown.length === 0 ? <div className="card"><EmptyState icon={<Bell className="h-6 w-6" />} title="No notifications" message="You're all caught up." /></div> : (
        <ul className="card divide-y divide-navy-50 overflow-hidden">
          {shown.map((n) => {
            const M = TYPE_META[n.type];
            return (
              <li key={n.id} className={clsx('flex gap-4 p-4 sm:p-5', !n.read && 'bg-gold-50/30')}>
                <span className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', M.cls)}><M.icon className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-navy-900">{n.title}</p>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-gold-500" aria-label="Unread" />}
                  </div>
                  <p className="text-sm text-navy-600">{n.message}</p>
                  <p className="mt-1 text-xs text-navy-400">{fmtDate(n.date)} · {relativeDay(n.date)}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {n.link && <Button size="sm" variant="outline" onClick={() => { update(n.id, { read: true }); navigate(n.link!); }}>Open</Button>}
                    <Button size="sm" variant="ghost" onClick={() => update(n.id, { read: !n.read })}>Mark {n.read ? 'unread' : 'read'}</Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => { remove(n.id); toast.info('Notification removed'); }} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={compose} onClose={() => setCompose(false)} title="New message" subtitle={student ? `Regarding ${student.name}` : undefined}
        footer={<><Button variant="outline" onClick={() => setCompose(false)}>Cancel</Button><Button loading={f.submitting} icon={<Send className="h-4 w-4" />} onClick={() => send()}>Send message</Button></>}>
        <form onSubmit={send} className="space-y-4" noValidate>
          <Field label="To" required error={f.errors.to}><Select {...f.bind('to')} placeholder="Select recipient" options={recipients} /></Field>
          <Field label="Subject" required error={f.errors.subject}><Input placeholder="e.g. Query about homework" {...f.bind('subject')} /></Field>
          <Field label="Message" required error={f.errors.message}><Textarea rows={5} placeholder="Write your message…" {...f.bind('message')} /></Field>
          <p className="text-xs text-navy-400">Demo: messages are stored in the portal; in production they are delivered to the staff inbox and via SMS / app notification.</p>
        </form>
      </Modal>
    </div>
  );
}
