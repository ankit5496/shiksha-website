import { useMemo, useState } from 'react';
import clsx from 'clsx';
import type { TimetableEntry, Weekday } from '@/types';
import { useCollection } from '@/hooks/useCollection';
import { EmptyState, PageHeader, Spinner, Tabs } from '@/components/ui';
import { weekdayKey } from '@/utils/format';
import { useClassSectionLabel, useTeacher } from '@/modules/lms/_shared';

const DAYS: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIMES = ['08:00 – 08:40', '08:40 – 09:20', '09:20 – 10:00', '10:20 – 11:00', '11:00 – 11:40', '11:40 – 12:20', '12:20 – 01:00'];

function Slot({ e, csLabel }: { e?: TimetableEntry; csLabel: (cs: string) => string }) {
  if (!e) return <div className="flex h-full min-h-[64px] items-center justify-center rounded-lg border border-dashed border-navy-100 text-xs text-navy-300">Free</div>;
  return (
    <div className="h-full min-h-[64px] rounded-lg border border-navy-100 bg-navy-50/60 p-2.5">
      <p className="text-sm font-semibold text-navy-900">{e.subject}</p>
      <p className="text-xs text-navy-500">{csLabel(`${e.classId}-${e.section}`)}</p>
    </div>
  );
}

export default function TeacherTimetable() {
  const { teacher, loading: tLoading } = useTeacher();
  const { items, loading } = useCollection('timetable');
  const csLabel = useClassSectionLabel();
  const today = weekdayKey();
  const [day, setDay] = useState<Weekday>(today === 'Sun' ? 'Mon' : today);

  const mine = useMemo(() => items.filter((t) => t.teacherName === teacher?.name), [items, teacher]);
  const at = (d: Weekday, p: number) => mine.find((t) => t.day === d && t.period === p);

  if (tLoading || loading) return <Spinner />;
  if (!teacher) return <EmptyState title="Teacher profile not found" />;

  const perDay = DAYS.map((d) => mine.filter((t) => t.day === d).length);

  return (
    <div>
      <PageHeader eyebrow="Classroom" title="My timetable" subtitle={`${mine.length} periods per week across ${teacher.classes.length} class sections`} />
      {mine.length === 0 ? <div className="card"><EmptyState title="No periods assigned" message="The academic office has not assigned periods to you yet." /></div> : (
        <>
          {/* Desktop grid */}
          <div className="card hidden overflow-x-auto p-4 lg:block">
            <div className="grid min-w-[900px] grid-cols-[120px_repeat(6,1fr)] gap-2">
              <div />
              {DAYS.map((d, i) => (
                <div key={d} className={clsx('rounded-lg py-2 text-center text-sm font-semibold', d === today ? 'bg-navy-950 text-white' : 'text-navy-600')}>
                  {d}<span className={clsx('ml-1 text-xs font-normal', d === today ? 'text-gold-300' : 'text-navy-400')}>({perDay[i]})</span>
                </div>
              ))}
              {TIMES.map((time, pi) => (
                <div key={time} className="contents">
                  <div className="flex flex-col justify-center pr-2 text-xs text-navy-500"><span className="font-semibold text-navy-800">Period {pi + 1}</span>{time}</div>
                  {DAYS.map((d) => <div key={d} className={clsx(d === today && 'rounded-lg ring-2 ring-gold-200')}><Slot e={at(d, pi + 1)} csLabel={csLabel} /></div>)}
                </div>
              ))}
            </div>
          </div>
          {/* Mobile day tabs */}
          <div className="lg:hidden">
            <Tabs className="mb-4" value={day} onChange={setDay} tabs={DAYS.map((d, i) => ({ value: d, label: d === today ? `${d} • Today` : d, count: perDay[i] }))} />
            <div className="card divide-y divide-navy-50">
              {TIMES.map((time, pi) => {
                const e = at(day, pi + 1);
                return (
                  <div key={time} className="flex items-center gap-3 px-4 py-3">
                    <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold', e ? 'bg-navy-950 text-white' : 'bg-mist text-navy-400')}>P{pi + 1}</span>
                    <div className="min-w-0 flex-1">
                      {e ? <><p className="text-sm font-semibold text-navy-900">{e.subject}</p><p className="text-xs text-navy-500">{csLabel(`${e.classId}-${e.section}`)}</p></> : <p className="text-sm text-navy-400">Free period</p>}
                    </div>
                    <span className="text-xs text-navy-400">{time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
