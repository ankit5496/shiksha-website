import { useState } from 'react';
import { CalendarClock, ClipboardList, Paperclip, Send } from 'lucide-react';
import type { Assignment, Submission } from '@/types';
import { useStudentContext } from '@/hooks/useStudentContext';
import { useForm, v } from '@/hooks/useForm';
import { useToast } from '@/context/ToastContext';
import { Badge, Button, EmptyState, Field, Modal, PageHeader, Spinner, Tabs, Textarea } from '@/components/ui';
import { fmtDate, relativeDay, todayISO } from '@/utils/format';
import { SubjectIcon, stateTone, useStudentAssignments, type AssignmentState } from './_shared';

type Tab = 'pending' | 'submitted' | 'graded';
const tabOf = (s: AssignmentState): Tab => (s === 'Graded' ? 'graded' : s === 'Submitted' || s === 'Late' ? 'submitted' : 'pending');

function AssignmentModal({ item, onClose, studentId }: { item: { a: Assignment; sub?: Submission; state: AssignmentState } | null; onClose: () => void; studentId: string }) {
  const toast = useToast();
  const { submissions } = useStudentAssignments();
  const form = useForm({ text: item?.sub?.text ?? '', fileName: item?.sub?.fileName ?? '' }, { text: [v.required('Please write your answer'), v.minLength(10, 'Answer must be at least 10 characters')] });
  const [lastId, setLastId] = useState<string | null>(null);
  if (item && item.a.id !== lastId) { setLastId(item.a.id); form.reset({ text: item.sub?.text ?? '', fileName: item.sub?.fileName ?? '' }); }
  if (!item && lastId) setLastId(null);

  const graded = item?.state === 'Graded';
  const submit = form.handleSubmit(async (vals) => {
    if (!item) return;
    const late = todayISO() > item.a.dueDate;
    const data = { text: vals.text.trim(), fileName: vals.fileName || undefined, submittedAt: todayISO(), status: (late ? 'Late' : 'Submitted') as Submission['status'] };
    try {
      if (item.sub) await submissions.update(item.sub.id, data);
      else await submissions.create({ assignmentId: item.a.id, studentId, ...data });
      toast.success(item.sub ? 'Submission updated' : 'Assignment submitted', late ? 'Submitted after the due date – marked as late.' : 'Your teacher will review it soon.');
      onClose();
    } catch (e) { toast.error('Could not submit', (e as Error).message); }
  });

  return (
    <Modal open={!!item} onClose={onClose} title={item?.a.title ?? ''} subtitle={item ? `${item.a.subject} · ${item.a.maxMarks} marks` : ''} size="lg"
      footer={item && !graded ? <><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={form.submitting} icon={<Send className="h-4 w-4" />} onClick={() => submit()}>{item.sub ? 'Resubmit' : 'Submit assignment'}</Button></> : <Button variant="outline" onClick={onClose}>Close</Button>}>
      {item && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={stateTone(item.state)} dot>{item.state}</Badge>
            <span className="flex items-center gap-1 text-sm text-navy-500"><CalendarClock className="h-4 w-4" />Due {fmtDate(item.a.dueDate)} ({relativeDay(item.a.dueDate)})</span>
          </div>
          <div className="rounded-xl bg-mist p-4">
            <p className="label">Instructions</p>
            <p className="text-sm leading-relaxed text-navy-700">{item.a.instructions}</p>
          </div>
          {graded && item.sub ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="font-serif text-3xl font-semibold text-emerald-700">{item.sub.marks}<span className="text-base text-emerald-600">/{item.a.maxMarks}</span></div>
                <div><p className="text-sm font-semibold text-emerald-800">Teacher feedback</p><p className="text-sm text-emerald-700">{item.sub.feedback || 'No feedback provided.'}</p></div>
              </div>
              <div><p className="label">Your answer</p><p className="whitespace-pre-wrap text-sm text-navy-700">{item.sub.text}</p>{item.sub.fileName && <p className="mt-2 flex items-center gap-1 text-xs text-navy-500"><Paperclip className="h-3.5 w-3.5" />{item.sub.fileName}</p>}</div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {item.sub && <p className="text-xs text-navy-500">Submitted on {fmtDate(item.sub.submittedAt)}. You can update your answer until your teacher grades it.</p>}
              <Field label="Your answer" required error={form.errors.text}>
                <Textarea rows={6} placeholder="Type your answer here…" value={form.values.text} onChange={(e) => form.set('text', e.target.value)} invalid={!!form.errors.text} />
              </Field>
              <Field label="Attachment (optional)" hint="PDF, image or document. In this demo only the file name is saved.">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-navy-200 px-4 py-3 text-sm text-navy-500 hover:border-navy-400">
                  <Paperclip className="h-4 w-4" />
                  <span className="truncate">{form.values.fileName || 'Choose a file…'}</span>
                  <input type="file" className="hidden" onChange={(e) => form.set('fileName', e.target.files?.[0]?.name ?? '')} />
                </label>
              </Field>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function StudentAssignments() {
  const { student, loading: sLoading } = useStudentContext();
  const { list, loading } = useStudentAssignments(student?.classId, student?.section, student?.id);
  const [tab, setTab] = useState<Tab>('pending');
  const [openId, setOpenId] = useState<string | null>(null);
  if (sLoading || loading) return <Spinner />;
  if (!student) return <EmptyState title="Student record not found" />;

  const shown = list.filter((x) => tabOf(x.state) === tab);
  const open = list.find((x) => x.a.id === openId) ?? null;
  const count = (t: Tab) => list.filter((x) => tabOf(x.state) === t).length;

  return (
    <div>
      <PageHeader eyebrow="Learning" title="Assignments" subtitle="Submit your work online and track teacher feedback" />
      <Tabs className="mb-6 w-fit" value={tab} onChange={setTab}
        tabs={[{ value: 'pending', label: 'Pending', count: count('pending') }, { value: 'submitted', label: 'Submitted', count: count('submitted') }, { value: 'graded', label: 'Graded', count: count('graded') }]} />
      {shown.length === 0 ? (
        <div className="card"><EmptyState icon={<ClipboardList className="h-6 w-6" />} title={tab === 'pending' ? 'No pending assignments' : tab === 'submitted' ? 'Nothing awaiting review' : 'No graded work yet'} message={tab === 'pending' ? 'Great job – you are all caught up!' : undefined} /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map(({ a, sub, state }) => (
            <button key={a.id} onClick={() => setOpenId(a.id)} className="card flex flex-col p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lift">
              <div className="flex items-start justify-between gap-3">
                <SubjectIcon subject={a.subject} />
                <Badge tone={stateTone(state)} dot>{state}</Badge>
              </div>
              <p className="mt-3 text-xs font-medium text-navy-400">{a.subject}</p>
              <h3 className="font-semibold leading-snug text-navy-900">{a.title}</h3>
              <p className="mt-2 line-clamp-2 flex-1 text-sm text-navy-500">{a.instructions}</p>
              <div className="mt-4 flex items-center justify-between border-t border-navy-50 pt-3 text-xs">
                <span className="text-navy-500">Due {fmtDate(a.dueDate)}</span>
                {state === 'Graded' && sub ? <span className="font-semibold text-emerald-700">{sub.marks}/{a.maxMarks} marks</span> : <span className="font-semibold text-navy-700">{a.maxMarks} marks</span>}
              </div>
            </button>
          ))}
        </div>
      )}
      <AssignmentModal item={open} onClose={() => setOpenId(null)} studentId={student.id} />
    </div>
  );
}
