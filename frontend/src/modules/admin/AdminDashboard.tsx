import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bus, CalendarCheck, CalendarDays, GraduationCap, Inbox, Megaphone, UserPlus, Users, Wallet } from 'lucide-react';
import { useCollection } from '@/hooks/useCollection';
import { Badge, PageHeader, Panel, ProgressBar, StatCard } from '@/components/ui';
import { fmtDate, fmtDay, inr, percent, relativeDay, todayISO } from '@/utils/format';
import { school } from '@/data/school';
import { BarList, ColumnChart, QuickAction, useClasses, useStaff } from './_shared';
import { EnquiriesPanel, PendingLeavesPanel, RecentPaymentsPanel, useSchoolStats } from './DashboardWidgets';

export default function AdminDashboard() {
  const stats = useSchoolStats();
  const { user, base } = useStaff();
  const { classes, name: className } = useClasses();
  const { items: payments } = useCollection('payments');
  const { items: events } = useCollection('events');

  const strength = useMemo(() => classes.map((c) => ({ label: className(c.id), value: stats.activeStudents.filter((s) => s.classId === c.id).length })).filter((x) => x.value > 0), [classes, stats.activeStudents, className]);
  const monthly = useMemo(() => {
    const ok = payments.filter((p) => p.status === 'Success');
    return ['04', '05', '06', '07', '08', '09', '10', '11', '12', '01', '02', '03'].map((m) => ({
      label: new Date(2026, Number(m) - 1, 1).toLocaleDateString('en-IN', { month: 'short' }),
      value: ok.filter((p) => p.date.slice(5, 7) === m).reduce((a, b) => a + b.amount, 0),
    }));
  }, [payments]);
  const upcoming = events.filter((e) => e.date >= todayISO()).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  const hour = new Date().getHours();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={fmtDate(todayISO(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        title={`Good ${hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'}, ${user?.name ?? 'Admin'}`}
        subtitle={`${school.name} · Session ${school.academicYear} overview`}
        actions={<Badge tone="gold">Demo data</Badge>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Students" value={stats.students} icon={<Users className="h-5 w-5" />} hint="Active on roll" />
        <StatCard label="Teachers" value={stats.teachers} icon={<GraduationCap className="h-5 w-5" />} tone="blue" hint={`${stats.teachersOnLeave} on leave`} />
        <StatCard label="Attendance" value={`${stats.attPct}%`} icon={<CalendarCheck className="h-5 w-5" />} tone="green" hint={stats.attIsToday ? 'Today' : `Last recorded ${relativeDay(stats.attDate ?? todayISO()).toLowerCase()}`} />
        <StatCard label="Fees collected" value={inr(stats.collected)} icon={<Wallet className="h-5 w-5" />} tone="gold" hint={`${percent(stats.collected, stats.expected)}% · ${inr(stats.outstanding)} due`} />
        <StatCard label="Buses on road" value={`${stats.busesActive}/${stats.busesTotal}`} icon={<Bus className="h-5 w-5" />} tone="navy" hint="Simulated GPS" />
        <StatCard label="New enquiries" value={stats.newEnquiries} icon={<Inbox className="h-5 w-5" />} tone="red" hint="Awaiting follow-up" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QuickAction to={`${base}/students`} icon={UserPlus} label="Add student" desc="New admission record" />
        <QuickAction to={`${base}/attendance`} icon={CalendarCheck} label="Mark attendance" desc="Today's roll call" />
        <QuickAction to={`${base}/communication`} icon={Megaphone} label="Publish announcement" desc="Parents, students, staff" />
        <QuickAction to={`${base}/fees`} icon={Wallet} label="Collect fee" desc="Counter payment & receipt" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Fee collection by month" subtitle={`Session ${school.academicYear}`} className="xl:col-span-2"
          action={<Link to={`${base}/fees`} className="text-xs font-semibold text-navy-500 hover:text-navy-900">Details</Link>}>
          <ColumnChart data={monthly} format={inr} />
          <div className="mt-5 grid gap-4 border-t border-navy-50 pt-4 sm:grid-cols-3">
            <div><p className="text-xs text-navy-400">Expected</p><p className="font-semibold">{inr(stats.expected)}</p></div>
            <div><p className="text-xs text-navy-400">Collected</p><p className="font-semibold text-emerald-700">{inr(stats.collected)}</p></div>
            <div><p className="text-xs text-navy-400">Outstanding</p><p className="font-semibold text-gold-700">{inr(stats.outstanding)}</p></div>
          </div>
          <ProgressBar className="mt-3" value={percent(stats.collected, stats.expected)} tone="gold" />
        </Panel>
        <Panel title="Class-wise strength" subtitle={`${stats.students} students`}>
          <BarList rows={strength} />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2"><PendingLeavesPanel /></div>
        <Panel title="Upcoming events" bodyClassName="p-0" action={<Link to={`${base}/communication`} className="text-xs font-semibold text-navy-500 hover:text-navy-900">Manage</Link>}>
          <ul className="divide-y divide-navy-50">
            {upcoming.map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-5 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-700"><CalendarDays className="h-4 w-4" /></span>
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{e.title}</p><p className="text-xs text-navy-400">{fmtDay(e.date)} · {e.venue}</p></div>
              </li>
            ))}
            {upcoming.length === 0 && <li className="px-5 py-8 text-center text-sm text-navy-400">No upcoming events</li>}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <RecentPaymentsPanel />
        <EnquiriesPanel />
      </div>
    </div>
  );
}
