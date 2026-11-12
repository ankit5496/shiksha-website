import { useMemo, useState } from 'react';
import clsx from 'clsx';
import type { Weekday } from '@/types';
import { EmptyState, PageHeader, Panel, Spinner, Tabs } from '@/components/ui';
import { useCollection } from '@/hooks/useCollection';
import { useStudentContext } from '@/hooks/useStudentContext';
import { weekdayKey } from '@/utils/format';

const DAYS: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SUBJECT_TINT: Record<string, string> = {
  Mathematics: 'bg-sky-50 text-sky-800', Science: 'bg-emerald-50 text-emerald-800', English: 'bg-violet-50 text-violet-800',
  Hindi: 'bg-orange-50 text-orange-800', 'Social Science': 'bg-amber-50 text-amber-800', Computer: 'bg-cyan-50 text-cyan-800',
  'Physical Education': 'bg-lime-50 text-lime-800', Sanskrit: 'bg-rose-50 text-rose-800',
};
const tint = (s: string) => SUBJECT_TINT[s] ?? 'bg-navy-50 text-navy-800';

export default function Timetable() {
  const { student, className, loading } = useStudentContext();
  const { items: timetable, loading: tl } = useCollection('timetable');
  const todayKey = weekdayKey();
  const [day, setDay] = useState<Weekday>(DAYS.includes(todayKey as Weekday) ? (todayKey as Weekday) : 'Mon');

  const rows = useMemo(() => timetable.filter((t) => t.classId === student?.classId && t.section === student?.section), [timetable, student]);
  const periods = useMemo(() => [...new Map(rows.map((r) => [r.period, r.time])).entries()].sort((a, b) => a[0] - b[0]), [rows]);

  if (loading || tl) return <Spinner />;
  if (!student) return <EmptyState title="No student linked" />;
  const cell = (d: Weekday, p: number) => rows.find((r) => r.day === d && r.period === p);

  return (
    <div>
      <PageHeader eyebrow="Timetable" title="Weekly Timetable" subtitle={`${className} – Section ${student.section} · Session 2026-27`} />
      {rows.length === 0 ? <Panel><EmptyState title="Timetable not published yet" message="The class timetable will appear here once published by the school." /></Panel> : (
        <>
          <div className="card hidden overflow-x-auto md:block">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-28 bg-mist px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-500">Day</th>
                  {periods.map(([p, time]) => (
                    <th key={p} className="bg-mist px-2 py-3 text-left text-xs font-semibold text-navy-500">
                      <span className="block uppercase tracking-wide">Period {p}</span><span className="font-normal text-navy-400">{time}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((d) => (
                  <tr key={d} className={clsx(d === todayKey && 'bg-gold-50/50')}>
                    <td className="border-t border-navy-50 px-3 py-2 font-semibold text-navy-800">
                      {d}{d === todayKey && <span className="ml-2 rounded-full bg-gold-500 px-1.5 py-0.5 text-[10px] font-bold text-navy-950">TODAY</span>}
                    </td>
                    {periods.map(([p]) => {
                      const c = cell(d, p);
                      return (
                        <td key={p} className="border-t border-navy-50 p-1.5">
                          {c ? <div className={clsx('rounded-lg px-2.5 py-2', tint(c.subject))}><p className="text-[13px] font-semibold leading-tight">{c.subject}</p><p className="mt-0.5 truncate text-[11px] opacity-75">{c.teacherName}</p></div> : <span className="text-navy-200">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden">
            <Tabs tabs={DAYS.map((d) => ({ value: d, label: d === todayKey ? `${d} •` : d }))} value={day} onChange={setDay} className="mb-4" />
            <div className="space-y-2">
              {periods.map(([p, time]) => {
                const c = cell(day, p);
                return (
                  <div key={p} className="card flex items-center gap-3 p-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-mist text-xs font-bold text-navy-600">P{p}</span>
                    <div className="min-w-0 flex-1"><p className="font-semibold text-navy-900">{c?.subject ?? 'Free'}</p><p className="text-xs text-navy-400">{time}{c ? ` · ${c.teacherName}` : ''}</p></div>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="mt-4 text-xs text-navy-400">Recess: 10:00 – 10:20 AM. Timings are demo values pending confirmation.</p>
        </>
      )}
    </div>
  );
}
