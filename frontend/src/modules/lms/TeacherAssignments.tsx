import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClipboardCheck, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Assignment } from '@/types';
import { useCollection } from '@/hooks/useCollection';
import { useForm, v } from '@/hooks/useForm';
import { useToast } from '@/context/ToastContext';
import { Badge, Button, ConfirmDialog, DataTable, EmptyState, Field, Input, Modal, PageHeader, ProgressBar, Select, Spinner, Textarea, type Column } from '@/components/ui';
import { fmtDate, relativeDay, todayISO } from '@/utils/format';
import { SubjectIcon, splitCS, useClassSectionLabel, useTeacher } from './_shared';

type Values = { cs: string; subject: string; title: string; instructions: string; dueDate: string; maxMarks: string };

export default function TeacherAssignments() {
  const { teacher, loading: tLoading } = useTeacher();
  const { items, loading, create, update, remove } = useCollection('assignments');
  const { items: submissions } = useCollection('submissions');
  const { items: students } = useCollection('students');
  const { create: notify } = useCollection('notifications');
  const csLabel = useClassSectionLabel();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [deleting, setDeleting] = useState<Assignment | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('');

  const blank: Values = { cs: teacher?.classes[0] ?? '', subject: teacher?.subjects[0] ?? '', title: '', instructions: '', dueDate: '', maxMarks: '20' };
  const form = useForm<Values>(blank, {
    cs: [v.required('Select a class')],
    subject: [v.required('Select a subject')],
    title: [v.required('Title is required'), v.minLength(4)],
    instructions: [v.required('Instructions are required'), v.minLength(10)],
    dueDate: [v.required('Pick a due date'), (val) => (!editing && val && String(val) < todayISO() ? 'Due date cannot be in the past' : undefined)],
    maxMarks: [v.required(), v.min(1), v.max(100)],
  });

  const openForm = (a: Assignment | null) => {
    setEditing(a);
    form.reset(a ? { cs: `${a.classId}-${a.section}`, subject: a.subject, title: a.title, instructions: a.instructions, dueDate: a.dueDate, maxMarks: String(a.maxMarks) } : blank);
    setOpen(true);
  };

  useEffect(() => {
    if (params.get('new') && teacher) { openForm(null); params.delete('new'); setParams(params, { replace: true }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, teacher]);

  if (tLoading || loading) return <Spinner />;
  if (!teacher) return <EmptyState title="Teacher profile not found" />;

  const mine = items.filter((a) => a.createdBy === teacher.id).filter((a) => !filter || `${a.classId}-${a.section}` === filter).sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  const strength = (a: Assignment) => students.filter((s) => s.classId === a.classId && s.section === a.section).length;
  const subCount = (a: Assignment) => submissions.filter((s) => s.assignmentId === a.id).length;

  const submit = form.handleSubmit(async (val) => {
    const { classId, section } = splitCS(val.cs);
    const data = { classId, section, subject: val.subject, title: val.title.trim(), instructions: val.instructions.trim(), dueDate: val.dueDate, maxMarks: Number(val.maxMarks) };
    try {
      if (editing) { await update(editing.id, data); toast.success('Assignment updated'); }
      else {
        await create({ ...data, createdBy: teacher.id, createdAt: todayISO() });
        await notify({ target: 'student', title: `New assignment – ${data.subject}`, message: `"${data.title}" is due on ${fmtDate(data.dueDate)}.`, date: todayISO(), read: false, type: 'homework', link: '/student/assignments' });
        toast.success('Assignment published', `Students of ${csLabel(val.cs)} have been notified.`);
      }
      setOpen(false);
    } catch (e) { toast.error('Could not save', (e as Error).message); }
  });

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try { await remove(deleting.id); toast.success('Assignment deleted'); setDeleting(null); }
    catch (e) { toast.error('Delete failed', (e as Error).message); }
    finally { setBusy(false); }
  };

  const columns: Column<Assignment>[] = [
    { key: 'title', header: 'Assignment', render: (a) => (
      <div className="flex items-center gap-3"><SubjectIcon subject={a.subject} size="sm" /><div className="min-w-0"><p className="font-medium text-navy-900">{a.title}</p><p className="text-xs text-navy-400">{a.subject}</p></div></div>
    ) },
    { key: 'class', header: 'Class', value: (a) => csLabel(`${a.classId}-${a.section}`) },
    { key: 'dueDate', header: 'Due', render: (a) => <div><p>{fmtDate(a.dueDate)}</p><p className="text-xs text-navy-400">{relativeDay(a.dueDate)}</p></div>, value: (a) => a.dueDate },
    { key: 'maxMarks', header: 'Marks' },
    { key: 'subs', header: 'Submissions', value: (a) => subCount(a), render: (a) => (
      <div className="w-32"><p className="mb-1 text-xs text-navy-500">{subCount(a)} / {strength(a)}</p><ProgressBar value={(subCount(a) / Math.max(1, strength(a))) * 100} tone="gold" /></div>
    ) },
    { key: 'status', header: 'Status', value: (a) => (a.dueDate >= todayISO() ? 'Active' : 'Closed'), render: (a) => <Badge tone={a.dueDate >= todayISO() ? 'blue' : 'grey'} dot>{a.dueDate >= todayISO() ? 'Active' : 'Closed'}</Badge> },
  ];

  return (
    <div>
      <PageHeader eyebrow="LMS" title="Assignments" subtitle="Create assignments for your classes and track submissions"
        actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => openForm(null)}>Create assignment</Button>} />
      <DataTable rows={mine} columns={columns} searchPlaceholder="Search assignments…"
        toolbar={<Select className="w-44" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="All classes" options={teacher.classes.map((cs) => ({ value: cs, label: csLabel(cs) }))} />}
        emptyTitle="No assignments yet" emptyMessage="Create your first assignment to get started."
        actions={(a) => <>
          <Link to={`/teacher/submissions?assignment=${a.id}`} className="btn-ghost btn-sm" title="Review submissions"><ClipboardCheck className="h-4 w-4" /></Link>
          <button className="btn-ghost btn-sm" title="Edit" aria-label="Edit" onClick={() => openForm(a)}><Pencil className="h-4 w-4" /></button>
          <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" title="Delete" aria-label="Delete" onClick={() => setDeleting(a)}><Trash2 className="h-4 w-4" /></button>
        </>} />

      <Modal open={open} onClose={() => setOpen(false)} size="lg" title={editing ? 'Edit assignment' : 'Create assignment'} subtitle="Students will see this in their LMS"
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button loading={form.submitting} onClick={() => submit()}>{editing ? 'Save changes' : 'Publish assignment'}</Button></>}>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Class & section" required error={form.errors.cs}>
            <Select {...form.bind('cs')} placeholder="Select" options={teacher.classes.map((cs) => ({ value: cs, label: csLabel(cs) }))} />
          </Field>
          <Field label="Subject" required error={form.errors.subject}>
            <Select {...form.bind('subject')} placeholder="Select" options={teacher.subjects.map((s) => ({ value: s, label: s }))} />
          </Field>
          <Field label="Title" required error={form.errors.title} className="sm:col-span-2"><Input {...form.bind('title')} placeholder="e.g. Food chains worksheet" /></Field>
          <Field label="Instructions" required error={form.errors.instructions} className="sm:col-span-2"><Textarea rows={4} {...form.bind('instructions')} placeholder="Explain what students need to do…" /></Field>
          <Field label="Due date" required error={form.errors.dueDate}><Input type="date" min={editing ? undefined : todayISO()} {...form.bind('dueDate')} /></Field>
          <Field label="Maximum marks" required error={form.errors.maxMarks}><Input type="number" min={1} max={100} {...form.bind('maxMarks')} /></Field>
        </form>
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={confirmDelete} loading={busy}
        title="Delete assignment?" message={`"${deleting?.title}" and its submissions will no longer be visible to students.`} />
    </div>
  );
}
