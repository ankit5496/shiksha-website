import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Bus, CalendarCheck, CalendarDays, CheckCircle2, ClipboardList, FileText, GraduationCap, Megaphone, Wallet } from 'lucide-react';
import { Avatar, Badge, EmptyState, Panel, Spinner, StatCard } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useCollection } from '@/hooks/useCollection';
import { useStudentContext } from '@/hooks/useStudentContext';
import { computeFeeSummary } from '@/utils/fees';
import { fmtDate, fmtDay, fmtShort, inr, relativeDay, todayISO, weekdayKey } from '@/utils/format';
import { fmtEta, useBusSimulation } from '@/modules/transport/useBusSimulation';
import { attendanceStats, useHomeworkDone, visibleTo } from './helpers';

export default function ParentDashboard() {
  const { user } = useAuth();
  const { student, className, loading } = useStudentContext();
  const { items: attendance } = useCollection('attendance');
  const { items: homework } = useCollection('homework');
  const { items: exams } = useCollection('exams');
  const { items: announcements } = useCollection('announcements');
  const { items: timetable } = useCollection('timetable');
  const { items: structures } = useCollection('feeStructures');
  const { items: studentFees } = useCollection('studentFees');
  const { items: payments } = useCollection('payments');
  const { items: routes } = useCollection('routes');
  const { items: buses } = useCollection('buses');
  const { items: leaves } = useCollection('leaves');
  const live = useBusSimulation(routes, buses);
  const { done } = useHomeworkDone(student?.id);
  const today = todayISO();

  const data = useMemo(() => {
    if (!student) return null;
    const month = today.slice(0, 7);
    const att = attendance.filter((a) => a.studentId === student.id);
    const monthStats = attendanceStats(att.filter((a) => a.date.startsWith(month)));
    const sessionStats = attendanceStats(att);
    const hw = homework.filter((h) => h.classId === student.classId && h.section === student.section);
    const pendingHw = hw.filter((h) => h.dueDate >= today && !done.has(h.id));
    const upcomingExams = exams.filter((e) => e.classId === student.classId && e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
    const todayKey = weekdayKey();
    const todayTT = timetable.filter((t) => t.classId === student.classId && t.section === student.section && t.day === todayKey).sort((a, b) => a.period - b.period);
    const sf = studentFees.find((x) => x.studentId === student.id);
    const fee = computeFeeSummary(structures.find((s) => s.id === sf?.structureId), sf, payments.filter((p) => p.studentId === student.id));
    const route = routes.find((r) => r.id === student.busRouteId);
    const bus = buses.find((b) => b.routeId === route?.id);
    const stopIdx = route?.stops.findIndex((s) => s.id === student.stopId) ?? -1;
    const notices = announcements.filter(visibleTo('parent')).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
    const activity = [
      ...payments.filter((p) => p.studentId === student.id).map((p) => ({ date: p.date, icon: Wallet, text: `${p.status === 'Success' ? 'Fee paid' : 'Payment failed'} – ${inr(p.amount)} (${p.installment})`, tone: p.status === 'Success' ? 'text-emerald-600' : 'text-red-600' })),
      ...hw.map((h) => ({ date: h.assignedDate, icon: BookOpen, text: `Homework assigned – ${h.subject}: ${h.title}`, tone: 'text-navy-600' })),
      ...leaves.filter((l) => l.studentId === student.id).map((l) => ({ date: l.appliedOn, icon: FileText, text: `Leave application (${l.type}) – ${l.status}`, tone: 'text-gold-700' })),
    ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
    return { monthStats, sessionStats, pendingHw, upcomingExams, todayTT, fee, route, bus, stopIdx, notices, activity };
  }, [student, attendance, homework, exams, timetable, studentFees, structures, payments, routes, buses, announcements, leaves, done, today]);

  if (loading) return <Spinner />;
  if (!student || !data) return <EmptyState title="No student linked to this account" />;
  const l = data.bus ? live[data.bus.id] : undefined;
  const busEta = l && data.stopIdx >= 0 ? l.etas[data.stopIdx] : undefined;
  const hour = new Date().getHours();

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-navy-950 p-6 text-white sm:p-8">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold-500/10" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-navy-300">{hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'},</p>
            <h1 className="mt-1 font-serif text-3xl font-semibold">{user?.name}</h1>
            <p className="mt-2 text-sm text-navy-300">{fmtDate(today, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <Link to="/parent/profile" className="flex items-center gap-4 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10 transition hover:bg-white/[0.1]">
            <Avatar src={student.photo} name={student.name} size={56} className="ring-gold-400" />
            <div>
              <p className="font-semibold">{student.name}</p>
              <p className="text-sm text-navy-300">{className} – Section {student.section} · Roll No. {student.rollNo}</p>
              <p className="text-xs text-gold-300">Adm. No. {student.admissionNo}</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Attendance this month" value={`${data.monthStats.pct}%`} tone="green" icon={<CalendarCheck className="h-5 w-5" />} hint={`${data.monthStats.absent} absent · session ${data.sessionStats.pct}%`} />
        <StatCard label="Pending homework" value={data.pendingHw.length} tone="blue" icon={<ClipboardList className="h-5 w-5" />} hint={data.pendingHw[0] ? `Next: ${data.pendingHw[0].subject}, ${relativeDay(data.pendingHw[0].dueDate).toLowerCase()}` : 'All caught up'} />
        <StatCard label="Fees outstanding" value={inr(data.fee.outstanding)} tone={data.fee.outstanding ? 'gold' : 'green'} icon={<Wallet className="h-5 w-5" />} hint={data.fee.nextDue ? `${data.fee.nextDue.label.split(' (')[0]} due ${fmtShort(data.fee.nextDue.dueDate)}` : 'All instalments paid'} />
        <StatCard label="School bus" value={data.bus ? (l?.status === 'Reached School' ? 'At school' : busEta === null ? 'Stop passed' : fmtEta(busEta)) : 'Not opted'} tone="navy" icon={<Bus className="h-5 w-5" />} hint={data.bus ? `${data.bus.number} · ${data.route?.code} · simulated` : 'No transport'} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Today's timetable" subtitle={fmtDate(today, { weekday: 'long', day: 'numeric', month: 'short' })} action={<Link to="/parent/timetable" className="btn-ghost btn-sm">Full week <ArrowRight className="h-3.5 w-3.5" /></Link>} bodyClassName="p-0">
          {data.todayTT.length === 0 ? <EmptyState title="No classes today" message="Enjoy the holiday!" icon={<CalendarDays className="h-6 w-6" />} /> : (
            <ul className="grid divide-y divide-navy-50 sm:grid-cols-2 sm:divide-y-0">
              {data.todayTT.map((t) => (
                <li key={t.id} className="flex items-center gap-3 border-navy-50 px-5 py-3 sm:border-b">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mist text-xs font-bold text-navy-600">P{t.period}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy-900">{t.subject}</p>
                    <p className="truncate text-xs text-navy-400">{t.time} · {t.teacherName}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Quick links">
          <div className="grid grid-cols-2 gap-2">
            {[
              { to: '/parent/fees', label: 'Pay fees', icon: Wallet },
              { to: '/parent/transport', label: 'Track bus', icon: Bus },
              { to: '/parent/homework', label: 'Homework', icon: BookOpen },
              { to: '/parent/exams', label: 'Results', icon: GraduationCap },
              { to: '/parent/leave', label: 'Apply leave', icon: FileText },
              { to: '/parent/notices', label: 'Circulars', icon: Megaphone },
            ].map((q) => (
              <Link key={q.to} to={q.to} className="flex flex-col items-start gap-2 rounded-xl border border-navy-100 p-3 text-sm font-medium text-navy-800 transition hover:border-gold-300 hover:bg-gold-50/40">
                <q.icon className="h-5 w-5 text-gold-600" />{q.label}
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Upcoming exams" action={<Link to="/parent/exams" className="btn-ghost btn-sm">View all</Link>} bodyClassName="p-0">
          {data.upcomingExams.length === 0 ? <EmptyState title="No upcoming exams" /> : (
            <ul className="divide-y divide-navy-50">
              {data.upcomingExams.slice(0, 5).map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-navy-900">{e.subject}</p><p className="text-xs text-navy-400">{e.name}</p></div>
                  <div className="text-right"><p className="text-sm font-medium text-navy-800">{fmtDay(e.date)}</p><p className="text-[11px] text-navy-400">{relativeDay(e.date)}</p></div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Announcements" action={<Link to="/parent/notices" className="btn-ghost btn-sm">View all</Link>} bodyClassName="p-0">
          <ul className="divide-y divide-navy-50">
            {data.notices.map((a) => (
              <li key={a.id} className="px-5 py-3">
                <div className="flex items-center gap-2">{a.priority === 'high' && <Badge tone="red">Important</Badge>}<span className="text-[11px] text-navy-400">{fmtShort(a.date)}</span></div>
                <p className="mt-1 text-sm font-semibold text-navy-900">{a.title}</p>
                <p className="line-clamp-2 text-xs text-navy-500">{a.body}</p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Recent activity">
          {data.activity.length === 0 ? <EmptyState title="No recent activity" /> : (
            <ol className="space-y-4">
              {data.activity.map((a, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mist"><a.icon className={`h-4 w-4 ${a.tone}`} /></span>
                  <div className="min-w-0"><p className="text-sm text-navy-800">{a.text}</p><p className="text-[11px] text-navy-400">{relativeDay(a.date)}</p></div>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-4 flex items-center gap-1.5 text-[11px] text-navy-400"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />Updated just now</p>
        </Panel>
      </div>
    </div>
  );
}
