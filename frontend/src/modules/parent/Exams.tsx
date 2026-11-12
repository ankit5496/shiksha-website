import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { CalendarDays, Clock, MapPin, TrendingUp } from 'lucide-react';
import { Badge, EmptyState, PageHeader, Panel, Spinner, StatCard, Tabs } from '@/components/ui';
import { useCollection } from '@/hooks/useCollection';
import { useStudentContext } from '@/hooks/useStudentContext';
import { gradeFor } from '@/data/seed';
import { fmtDate, percent, relativeDay, todayISO } from '@/utils/format';

type Tab = 'schedule' | 'results' | 'progress';

function Bar({ label, value, sub, highlight }: { label: string; value: number; sub?: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex h-44 w-full max-w-[56px] items-end overflow-hidden rounded-t-lg bg-mist">
        <div className={clsx('w-full rounded-t-lg transition-all duration-700', highlight ? 'bg-gold-500' : 'bg-navy-700')} style={{ height: `${value}%` }} />
        <span className="absolute inset-x-0 top-1.5 text-center text-[11px] font-bold text-navy-700">{value}%</span>
      </div>
      <p className="max-w-[90px] text-center text-[11px] font-medium leading-tight text-navy-600">{label}</p>
      {sub && <p className="-mt-1.5 text-[10px] text-navy-400">{sub}</p>}
    </div>
  );
}

export default function Exams() {
  const { student, className, loading } = useStudentContext();
  const { items: exams, loading: el } = useCollection('exams');
  const { items: results, loading: rl } = useCollection('results');
  const [tab, setTab] = useState<Tab>('schedule');
  const today = todayISO();

  const schedule = useMemo(() => exams.filter((e) => e.classId === student?.classId).sort((a, b) => a.date.localeCompare(b.date)), [exams, student]);
  const mine = useMemo(() => results.filter((r) => r.studentId === student?.id), [results, student]);
  const examNames = useMemo(() => [...new Set(mine.map((r) => r.examName))], [mine]);
  const [examSel, setExamSel] = useState('');
  const activeExam = examSel || examNames[examNames.length - 1] || '';

  if (loading || el || rl) return <Spinner />;
  if (!student) return <EmptyState title="No student linked" />;

  const examRows = mine.filter((r) => r.examName === activeExam);
  const total = examRows.reduce((a, b) => a + b.marks, 0);
  const max = examRows.reduce((a, b) => a + b.maxMarks, 0);
  const perExam = examNames.map((n) => { const rs = mine.filter((r) => r.examName === n); return { name: n, pct: percent(rs.reduce((a, b) => a + b.marks, 0), rs.reduce((a, b) => a + b.maxMarks, 0)) }; });
  const subjects = [...new Set(mine.map((r) => r.subject))];
  const perSubject = subjects.map((s) => { const rs = mine.filter((r) => r.subject === s); return { name: s, pct: percent(rs.reduce((a, b) => a + b.marks, 0), rs.reduce((a, b) => a + b.maxMarks, 0)) }; });
  const best = [...perSubject].sort((a, b) => b.pct - a.pct)[0];
  const trend = perExam.length > 1 ? perExam[perExam.length - 1].pct - perExam[0].pct : 0;

  return (
    <div>
      <PageHeader eyebrow="Examinations" title="Exams & Results" subtitle={`${student.name} · ${className} – ${student.section}`} />
      <Tabs className="mb-5 w-fit" value={tab} onChange={setTab} tabs={[{ value: 'schedule', label: 'Exam schedule' }, { value: 'results', label: 'Results' }, { value: 'progress', label: 'Academic progress' }]} />

      {tab === 'schedule' && (
        schedule.length === 0 ? <Panel><EmptyState title="No exams scheduled" /></Panel> : (
          <Panel title={schedule[0].name} subtitle="Date sheet · reach school 20 minutes before the exam" bodyClassName="p-0">
            <ul className="divide-y divide-navy-50">
              {schedule.map((e) => {
                const past = e.date < today;
                return (
                  <li key={e.id} className={clsx('flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center', past && 'opacity-60')}>
                    <div className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-navy-950 py-2 text-white">
                      <span className="text-[10px] uppercase tracking-wider text-gold-300">{fmtDate(e.date, { month: 'short' })}</span>
                      <span className="font-serif text-xl font-semibold">{fmtDate(e.date, { day: 'numeric' })}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-navy-900">{e.subject}</p>
                      <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-navy-500">
                        <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{fmtDate(e.date, { weekday: 'long' })}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{e.time}</span>
                        {e.room && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{e.room}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2"><Badge tone="grey">Max {e.maxMarks}</Badge><Badge tone={past ? 'grey' : 'blue'}>{past ? 'Completed' : relativeDay(e.date)}</Badge></div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        )
      )}

      {tab === 'results' && (
        examNames.length === 0 ? <Panel><EmptyState title="No results published yet" /></Panel> : (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {examNames.map((n) => <button key={n} onClick={() => setExamSel(n)} className={clsx('rounded-full border px-4 py-1.5 text-sm font-medium transition', n === activeExam ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-200 bg-white text-navy-600 hover:border-navy-400')}>{n}</button>)}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Total marks" value={`${total} / ${max}`} />
              <StatCard label="Percentage" value={`${percent(total, max)}%`} tone="gold" />
              <StatCard label="Overall grade" value={gradeFor(percent(total, max))} tone="green" />
            </div>
            <div className="card overflow-x-auto">
              <table className="table-base">
                <thead><tr><th>Subject</th><th>Marks obtained</th><th>Maximum</th><th>Percentage</th><th>Grade</th></tr></thead>
                <tbody>
                  {examRows.map((r) => (
                    <tr key={r.id}>
                      <td className="font-medium">{r.subject}</td><td className="font-semibold">{r.marks}</td><td>{r.maxMarks}</td>
                      <td><div className="flex items-center gap-2"><div className="h-1.5 w-20 overflow-hidden rounded-full bg-navy-50"><div className="h-full bg-navy-700" style={{ width: `${percent(r.marks, r.maxMarks)}%` }} /></div>{percent(r.marks, r.maxMarks)}%</div></td>
                      <td><Badge tone={r.grade.startsWith('A') ? 'green' : r.grade.startsWith('B') ? 'blue' : r.grade.startsWith('C') ? 'amber' : 'red'}>{r.grade}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-navy-400">Grading scale (demo, CBSE-style): A1 91–100 · A2 81–90 · B1 71–80 · B2 61–70 · C1 51–60 · C2 41–50 · D 33–40 · E below 33.</p>
          </div>
        )
      )}

      {tab === 'progress' && (
        mine.length === 0 ? <Panel><EmptyState title="No results to chart yet" /></Panel> : (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Latest exam" value={`${perExam[perExam.length - 1]?.pct ?? 0}%`} icon={<TrendingUp className="h-5 w-5" />} hint={perExam[perExam.length - 1]?.name} />
              <StatCard label="Trend" value={`${trend >= 0 ? '+' : ''}${trend}%`} tone={trend >= 0 ? 'green' : 'red'} hint="Since first assessment" />
              <StatCard label="Strongest subject" value={best?.name ?? '—'} tone="gold" hint={best ? `${best.pct}% average` : undefined} />
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title="Performance by assessment">
                <div className="grid grid-flow-col auto-cols-fr gap-3">{perExam.map((p, i) => <Bar key={p.name} label={p.name} value={p.pct} highlight={i === perExam.length - 1} />)}</div>
              </Panel>
              <Panel title="Average by subject">
                <div className="grid grid-flow-col auto-cols-fr gap-2">{perSubject.map((p) => <Bar key={p.name} label={p.name} value={p.pct} highlight={p.name === best?.name} />)}</div>
              </Panel>
            </div>
          </div>
        )
      )}
    </div>
  );
}
