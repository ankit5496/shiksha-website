import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { BookOpen, Check, User } from 'lucide-react';
import { Badge, EmptyState, PageHeader, Select, Spinner, Tabs } from '@/components/ui';
import { useCollection } from '@/hooks/useCollection';
import { useStudentContext } from '@/hooks/useStudentContext';
import { fmtDate, relativeDay, todayISO } from '@/utils/format';
import { useHomeworkDone } from './helpers';

type Filter = 'pending' | 'today' | 'upcoming' | 'past' | 'all';

export default function Homework() {
  const { student, className, loading } = useStudentContext();
  const { items: homework, loading: hl } = useCollection('homework');
  const { done, toggle } = useHomeworkDone(student?.id);
  const [filter, setFilter] = useState<Filter>('pending');
  const [subject, setSubject] = useState('');
  const today = todayISO();

  const mine = useMemo(() => homework.filter((h) => h.classId === student?.classId && h.section === student?.section).sort((a, b) => a.dueDate.localeCompare(b.dueDate)), [homework, student]);
  const subjects = [...new Set(mine.map((h) => h.subject))];
  const shown = mine.filter((h) => (!subject || h.subject === subject) && (
    filter === 'all' ? true : filter === 'today' ? h.dueDate === today : filter === 'upcoming' ? h.dueDate > today : filter === 'past' ? h.dueDate < today : h.dueDate >= today && !done.has(h.id)));

  if (loading || hl) return <Spinner />;
  if (!student) return <EmptyState title="No student linked" />;

  const statusOf = (due: string): [string, 'red' | 'amber' | 'blue' | 'grey'] =>
    due < today ? ['Past due date', 'grey'] : due === today ? ['Due today', 'red'] : relativeDay(due) === 'Tomorrow' ? ['Due tomorrow', 'amber'] : ['Upcoming', 'blue'];

  return (
    <div>
      <PageHeader eyebrow="Homework" title="Homework & Assignments" subtitle={`${className} – ${student.section} · tick items off as they are completed at home`} />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onChange={setFilter} tabs={[
          { value: 'pending', label: 'Pending', count: mine.filter((h) => h.dueDate >= today && !done.has(h.id)).length },
          { value: 'today', label: 'Due today' }, { value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past' }, { value: 'all', label: 'All' },
        ]} />
        <Select className="sm:w-52" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="All subjects" options={subjects.map((s) => ({ value: s, label: s }))} />
      </div>
      {shown.length === 0 ? <div className="card"><EmptyState icon={<BookOpen className="h-6 w-6" />} title="No homework here" message="Nothing matches this filter. Great job staying on top!" /></div> : (
        <div className="grid gap-4 md:grid-cols-2">
          {shown.map((h) => {
            const isDone = done.has(h.id);
            const [label, tone] = statusOf(h.dueDate);
            return (
              <article key={h.id} className={clsx('card p-5 transition', isDone && 'opacity-70')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2"><Badge tone="gold">{h.subject}</Badge><Badge tone={tone}>{label}</Badge></div>
                  <button onClick={() => toggle(h.id)} aria-pressed={isDone}
                    className={clsx('flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition', isDone ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-navy-200 text-navy-600 hover:border-navy-400')}>
                    <Check className="h-3.5 w-3.5" />{isDone ? 'Done' : 'Mark done'}
                  </button>
                </div>
                <h3 className={clsx('mt-3 font-sans text-base font-semibold text-navy-900', isDone && 'line-through')}>{h.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-navy-600">{h.description}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-navy-50 pt-3 text-xs text-navy-400">
                  <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{h.teacherName}</span>
                  <span>Given {fmtDate(h.assignedDate, { day: 'numeric', month: 'short' })} · <strong className="text-navy-700">Due {fmtDate(h.dueDate, { weekday: 'short', day: 'numeric', month: 'short' })}</strong></span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
