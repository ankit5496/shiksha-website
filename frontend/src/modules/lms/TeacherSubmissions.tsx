import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, ClipboardCheck, Clock, Paperclip, Users } from 'lucide-react';
import type { Student, Submission } from '@/types';
import { useCollection } from '@/hooks/useCollection';
import { useForm, v } from '@/hooks/useForm';
import { useToast } from '@/context/ToastContext';
import { Avatar, Badge, Button, EmptyState, Field, Input, Modal, PageHeader, SearchSelect, Spinner, StatCard, Tabs, Textarea } from '@/components/ui';
import { fmtDate, todayISO } from '@/utils/format';
import { useClassSectionLabel, useTeacher } from './_shared';

type Row = { student: Student; sub?: Submission; status: 'Not submitted' | Submission['status'] };
type Filter = 'all' | 'Not submitted' | 'Submitted' | 'Late' | 'Graded';
const tone = { 'Not submitted': 'grey', Submitted: 'blue', Late: 'amber', Graded: 'green' } as const;

export default function TeacherSubmissions() {
  const { teacher, loading: tLoading } = useTeacher();
  const { items: assignments, loading } = useCollection('assignments');
  const { items: submissions, update } = useCollection('submissions');
  const { items: students } = useCollection('students');
  const { create: notify } = useCollection('notifications');
  const csLabel = useClassSectionLabel();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<Filter>('all');
  const [grading, setGrading] = useState<Row | null>(null);

  const mine = useMemo(() => assignments.filter((a) => a.createdBy === teacher?.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [assignments, teacher]);
  const selectedId = params.get('assignment') ?? mine.find((a) => submissions.some((s) => s.assignmentId === a.id && s.status !== 'Graded'))?.id ?? mine[0]?.id ?? '';
  const assignment = mine.find((a) => a.id === selectedId);

  const rows: Row[] = useMemo(() => {
    if (!assignment) return [];
    return students.filter((s) => s.classId === assignment.classId && s.section === assignment.section).sort((a, b) => a.rollNo - b.rollNo).map((student) => {
      const sub = submissions.find((x) => x.assignmentId === assignment.id && x.studentId === student.id);
      return { student, sub, status: sub ? sub.status : 'Not submitted' };
    });
  }, [assignment, students, submissions]);

  const form = useForm({ marks: '', feedback: '' }, {
    marks: [v.required('Enter marks'), v.min(0, 'Marks cannot be negative'), (val) => (assignment && Number(val) > assignment.maxMarks ? `Maximum is ${assignment.maxMarks}` : undefined)],
    feedback: [v.required('Add a short feedback note')],
  });

  const openGrade = (r: Row) => { setGrading(r); form.reset({ marks: r.sub?.marks !== undefined ? String(r.sub.marks) : '', feedback: r.sub?.feedback ?? '' }); };

  const save = form.handleSubmit(async (val) => {
    if (!grading?.sub || !assignment) return;
    try {
      await update(grading.sub.id, { marks: Number(val.marks), feedback: val.feedback.trim(), status: 'Graded' });
      await notify({ target: 'student', title: 'Assignment graded', message: `"${assignment.title}" – you scored ${val.marks}/${assignment.maxMarks}.`, date: todayISO(), read: false, type: 'homework', link: '/student/assignments' });
      toast.success('Marks saved', `${grading.student.name}: ${val.marks}/${assignment.maxMarks}`);
      setGrading(null);
    } catch (e) { toast.error('Could not save marks', (e as Error).message); }
  });

  if (tLoading || loading) return <Spinner />;
  if (!teacher) return <EmptyState title="Teacher profile not found" />;
  if (mine.length === 0) return (<div><PageHeader eyebrow="LMS" title="Review submissions" /><div className="card"><EmptyState title="No assignments created yet" message="Create an assignment to start receiving submissions." /></div></div>);

  const count = (f: Filter) => (f === 'all' ? rows.length : rows.filter((r) => r.status === f).length);
  const shown = rows.filter((r) => filter === 'all' || r.status === filter);
  const graded = rows.filter((r) => r.status === 'Graded' && r.sub?.marks !== undefined);
  const avg = graded.length ? Math.round(graded.reduce((a, r) => a + (r.sub!.marks ?? 0), 0) / graded.length * 10) / 10 : 0;

  return (
    <div>
      <PageHeader eyebrow="LMS" title="Review submissions" subtitle="Grade student work and share feedback" />
      <div className="card mb-6 flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
        <div className="lg:w-96">
          <p className="label">Assignment</p>
          <SearchSelect value={selectedId} onChange={(id) => { setParams({ assignment: id }); setFilter('all'); }}
            options={mine.map((a) => ({ value: a.id, label: a.title, sub: csLabel(`${a.classId}-${a.section}`) }))} />
        </div>
        {assignment && (
          <div className="flex-1 text-sm text-navy-500 lg:border-l lg:border-navy-50 lg:pl-5">
            <p className="font-medium text-navy-900">{assignment.subject} · {csLabel(`${assignment.classId}-${assignment.section}`)}</p>
            <p>Due {fmtDate(assignment.dueDate)} · {assignment.maxMarks} marks</p>
            <p className="mt-1 line-clamp-1 text-xs">{assignment.instructions}</p>
          </div>
        )}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Class strength" value={rows.length} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Submitted" value={rows.length - count('Not submitted')} icon={<ClipboardCheck className="h-5 w-5" />} tone="blue" />
        <StatCard label="Awaiting review" value={count('Submitted') + count('Late')} icon={<Clock className="h-5 w-5" />} tone="gold" />
        <StatCard label="Average marks" value={graded.length ? `${avg}/${assignment?.maxMarks}` : '—'} icon={<CheckCircle2 className="h-5 w-5" />} tone="green" />
      </div>

      <Tabs className="mb-4" value={filter} onChange={setFilter} tabs={(['all', 'Submitted', 'Late', 'Graded', 'Not submitted'] as Filter[]).map((f) => ({ value: f, label: f === 'all' ? 'All students' : f, count: count(f) }))} />

      <div className="card overflow-hidden">
        {shown.length === 0 ? <EmptyState title="No students in this view" /> : (
          <ul className="divide-y divide-navy-50">
            {shown.map((r) => (
              <li key={r.student.id} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar src={r.student.photo} name={r.student.name} size={38} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-navy-900">{r.student.name}</p>
                    <p className="text-xs text-navy-400">Roll {r.student.rollNo}{r.sub ? ` · Submitted ${fmtDate(r.sub.submittedAt)}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:justify-end">
                  {r.status === 'Graded' && <span className="text-sm font-semibold text-navy-800">{r.sub?.marks}/{assignment?.maxMarks}</span>}
                  <Badge tone={tone[r.status]} dot>{r.status}</Badge>
                  {r.sub ? (
                    <Button size="sm" variant={r.status === 'Graded' ? 'outline' : 'primary'} onClick={() => openGrade(r)}>{r.status === 'Graded' ? 'Edit grade' : 'Review & grade'}</Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={async () => {
                      await notify({ target: 'student', title: 'Submission reminder', message: `Please submit "${assignment?.title}" by ${fmtDate(assignment?.dueDate)}.`, date: todayISO(), read: false, type: 'homework', link: '/student/assignments' });
                      toast.info('Reminder sent', `${r.student.name} has been reminded.`);
                    }}>Send reminder</Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal open={!!grading} onClose={() => setGrading(null)} size="lg" title={`Grade – ${grading?.student.name ?? ''}`} subtitle={assignment?.title}
        footer={<><Button variant="outline" onClick={() => setGrading(null)}>Cancel</Button><Button loading={form.submitting} onClick={() => save()}>Save marks</Button></>}>
        {grading?.sub && (
          <form onSubmit={save} className="space-y-5">
            <div className="rounded-xl bg-mist p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="label mb-0">Student answer</p>
                <Badge tone={tone[grading.status]}>{grading.status}</Badge>
              </div>
              <p className="whitespace-pre-wrap text-sm text-navy-700">{grading.sub.text}</p>
              {grading.sub.fileName && <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-navy-600"><Paperclip className="h-3.5 w-3.5" />{grading.sub.fileName}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={`Marks (out of ${assignment?.maxMarks})`} required error={form.errors.marks}>
                <Input type="number" min={0} max={assignment?.maxMarks} {...form.bind('marks')} />
              </Field>
              <Field label="Feedback" required error={form.errors.feedback} className="sm:col-span-2">
                <Textarea rows={3} {...form.bind('feedback')} placeholder="What went well, what to improve…" />
              </Field>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Excellent – well explained.', 'Good work, improve presentation.', 'Please revise the key concepts.'].map((t) => (
                <button type="button" key={t} onClick={() => form.set('feedback', t)} className="rounded-full border border-navy-100 px-3 py-1 text-xs text-navy-600 hover:border-navy-300">{t}</button>
              ))}
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
