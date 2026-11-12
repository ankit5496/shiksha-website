import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState, PageHeader, Panel, ProgressBar, Spinner } from '@/components/ui';
import { useCollection } from '@/hooks/useCollection';
import { useStudentContext } from '@/hooks/useStudentContext';
import { pad2, todayISO } from '@/utils/format';
import { ATTENDANCE_META, attendanceStats } from './helpers';

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Attendance() {
  const { student, loading } = useStudentContext();
  const { items: attendance, loading: al } = useCollection('attendance');
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const today = todayISO();

  const mine = useMemo(() => attendance.filter((a) => a.studentId === student?.id), [attendance, student]);
  const byDate = useMemo(() => new Map(mine.map((a) => [a.date, a.status])), [mine]);
  const prefix = `${ym.y}-${pad2(ym.m + 1)}`;
  const monthStats = attendanceStats(mine.filter((a) => a.date.startsWith(prefix)));
  const session = attendanceStats(mine);

  if (loading || al) return <Spinner />;
  if (!student) return <EmptyState title="No student linked" />;

  const first = new Date(ym.y, ym.m, 1);
  const days = new Date(ym.y, ym.m + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const move = (d: number) => setYm(({ y, m }) => { const n = new Date(y, m + d, 1); return { y: n.getFullYear(), m: n.getMonth() }; });
  const isCurrent = ym.y === now.getFullYear() && ym.m === now.getMonth();

  return (
    <div>
      <PageHeader eyebrow="Attendance" title="Attendance Record" subtitle={`${student.name} · daily attendance marked by the class teacher`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Panel title={first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          action={<div className="flex gap-1">
            <button className="btn-outline btn-sm" onClick={() => move(-1)} aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></button>
            <button className="btn-outline btn-sm" onClick={() => setYm({ y: now.getFullYear(), m: now.getMonth() })} disabled={isCurrent}>Today</button>
            <button className="btn-outline btn-sm" onClick={() => move(1)} disabled={isCurrent} aria-label="Next month"><ChevronRight className="h-4 w-4" /></button>
          </div>}>
          <div className="grid grid-cols-7 gap-1.5 text-center sm:gap-2">
            {WEEK.map((w) => <div key={w} className="pb-1 text-[11px] font-semibold uppercase tracking-wide text-navy-400">{w}</div>)}
            {cells.map((d, i) => {
              if (d === null) return <div key={`e${i}`} />;
              const date = `${prefix}-${pad2(d)}`;
              const st = byDate.get(date);
              const sunday = new Date(ym.y, ym.m, d).getDay() === 0;
              return (
                <div key={date} title={st ? ATTENDANCE_META[st].label : sunday ? 'Sunday' : date > today ? 'Upcoming' : 'Not marked'}
                  className={clsx('flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-medium transition sm:aspect-[1.2]',
                    st ? ATTENDANCE_META[st].cls : sunday ? 'bg-mist text-navy-300' : 'bg-white text-navy-400 ring-1 ring-inset ring-navy-50',
                    date === today && 'ring-2 ring-gold-500 ring-offset-1')}>
                  {d}
                  {st && <span className="hidden text-[9px] font-semibold uppercase opacity-80 sm:block">{ATTENDANCE_META[st].label}</span>}
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap gap-4 border-t border-navy-50 pt-4 text-xs text-navy-600">
            {(Object.keys(ATTENDANCE_META) as (keyof typeof ATTENDANCE_META)[]).map((k) => (
              <span key={k} className="flex items-center gap-1.5"><span className={clsx('h-3 w-3 rounded', ATTENDANCE_META[k].cls)} />{ATTENDANCE_META[k].label}</span>
            ))}
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-mist" />Sunday / not marked</span>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="This month">
            {monthStats.working === 0 ? <p className="text-sm text-navy-400">No attendance recorded for this month.</p> : (
              <>
                <p className="font-serif text-4xl font-semibold text-navy-900">{monthStats.pct}%</p>
                <ProgressBar value={monthStats.pct} tone={monthStats.pct >= 75 ? 'green' : 'red'} className="mt-3" />
                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  {[['Working days', monthStats.working], ['Present', monthStats.present], ['Late', monthStats.late], ['Absent', monthStats.absent]].map(([k, v]) => (
                    <div key={k} className="rounded-xl bg-mist p-3"><dt className="text-[11px] text-navy-400">{k}</dt><dd className="font-semibold text-navy-900">{v}</dd></div>
                  ))}
                </dl>
              </>
            )}
          </Panel>
          <Panel title="Session summary" subtitle="Since the start of records">
            <p className="font-serif text-3xl font-semibold text-navy-900">{session.pct}%</p>
            <p className="mt-1 text-xs text-navy-500">{session.present + session.late} of {session.working} working days attended · {session.holidays} holidays</p>
            <ProgressBar value={session.pct} tone="gold" className="mt-3" />
            <p className="mt-4 rounded-lg bg-navy-50 p-3 text-xs text-navy-600">A minimum of 75% attendance is generally expected for examination eligibility (demo policy – subject to school rules).</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
