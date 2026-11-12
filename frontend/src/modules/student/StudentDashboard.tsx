import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, BookOpen, CalendarCheck, ClipboardList, Clock, Library, Megaphone, PlayCircle, Sparkles } from 'lucide-react';
import { useCollection } from '@/hooks/useCollection';
import { useStudentContext } from '@/hooks/useStudentContext';
import { Badge, EmptyState, Panel, Spinner, StatCard } from '@/components/ui';
import { daysBetween, fmtDate, fmtShort, percent, relativeDay, todayISO, weekdayKey } from '@/utils/format';
import { MaterialCard, SubjectIcon, stateTone, useStudentAssignments } from '@/modules/lms/_shared';

export default function StudentDashboard() {
  const { student, className, loading } = useStudentContext();
  const { list: assignments } = useStudentAssignments(student?.classId, student?.section, student?.id);
  const { items: results } = useCollection('results');
  const { items: attendance } = useCollection('attendance');
  const { items: materials } = useCollection('materials');
  const { items: timetable } = useCollection('timetable');
  const { items: announcements } = useCollection('announcements');

  const today = todayISO();
  const day = weekdayKey();

  const stats = useMemo(() => {
    if (!student) return null;
    const mine = results.filter((r) => r.studentId === student.id);
    const avg = mine.length ? Math.round(mine.reduce((a, r) => a + (r.marks / r.maxMarks) * 100, 0) / mine.length) : 0;
    const att = attendance.filter((a) => a.studentId === student.id && a.status !== 'H');
    const present = att.filter((a) => a.status === 'P' || a.status === 'L').length;
    const newMaterials = materials.filter((m) => m.classId === student.classId && daysBetween(m.date, today) <= 7).length;
    return { avg, att: percent(present, att.length), newMaterials };
  }, [student, results, attendance, materials, today]);

  if (loading) return <Spinner />;
  if (!student || !stats) return <EmptyState title="Student record not found" />;

  const pending = assignments.filter((x) => x.state === 'Pending' || x.state === 'Overdue');
  const todays = timetable.filter((t) => t.classId === student.classId && t.section === student.section && t.day === day).sort((a, b) => a.period - b.period);
  const recent = materials.filter((m) => m.classId === student.classId).sort((a, b) => b.date.localeCompare(a.date));
  const notices = announcements.filter((a) => a.audience === 'all' || a.audience === 'students').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const firstName = student.name.split(' ')[0];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-navy-950 p-6 text-white sm:p-8">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold-500/10" />
        <div className="absolute -bottom-20 right-24 h-48 w-48 rounded-full bg-navy-700/40" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="eyebrow text-gold-300">{fmtDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h1 className="mt-2 font-serif text-3xl font-semibold">Hello, {firstName}</h1>
            <p className="mt-2 max-w-lg text-sm text-navy-200">
              {className} – {student.section} · Roll No. {student.rollNo}. You have <span className="font-semibold text-gold-300">{pending.length} pending assignment{pending.length === 1 ? '' : 's'}</span> and {todays.length} classes today.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/student/assignments" className="btn-gold"><ClipboardList className="h-4 w-4" />My assignments</Link>
            <Link to="/student/subjects" className="btn border border-white/20 text-white hover:bg-white/10"><Library className="h-4 w-4" />Study materials</Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending assignments" value={pending.length} icon={<ClipboardList className="h-5 w-5" />} tone="gold" hint={pending[0] ? `Next due ${relativeDay(pending[0].a.dueDate).toLowerCase()}` : 'All caught up'} />
        <StatCard label="Average score" value={`${stats.avg}%`} icon={<Award className="h-5 w-5" />} tone="green" hint="Across unit & periodic tests" />
        <StatCard label="Attendance" value={`${stats.att}%`} icon={<CalendarCheck className="h-5 w-5" />} tone="navy" hint="This session" />
        <StatCard label="New materials" value={stats.newMaterials} icon={<Sparkles className="h-5 w-5" />} tone="blue" hint="Added in the last 7 days" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Assignment deadlines" subtitle="Your assignments in order of due date"
          action={<Link to="/student/assignments" className="btn-ghost btn-sm">View all<ArrowRight className="h-3.5 w-3.5" /></Link>} bodyClassName="p-0">
          {assignments.length === 0 ? <EmptyState title="No assignments yet" /> : (
            <ul className="divide-y divide-navy-50">
              {assignments.slice(0, 6).map(({ a, state, sub }) => (
                <li key={a.id}>
                  <Link to="/student/assignments" className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-ivory">
                    <SubjectIcon subject={a.subject} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-navy-900">{a.title}</p>
                      <p className="text-xs text-navy-400">{a.subject} · Due {fmtDate(a.dueDate)} ({relativeDay(a.dueDate)})</p>
                    </div>
                    {state === 'Graded' && sub?.marks !== undefined && <span className="hidden text-sm font-semibold text-navy-800 sm:block">{sub.marks}/{a.maxMarks}</span>}
                    <Badge tone={stateTone(state)} dot>{state}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Today's timetable" subtitle={fmtDate(today, { weekday: 'long' })} action={<Link to="/student/timetable" className="btn-ghost btn-sm">Week</Link>} bodyClassName="p-0">
          {todays.length === 0 ? <EmptyState icon={<Clock className="h-6 w-6" />} title="No classes today" message="Enjoy your day off!" /> : (
            <ol className="divide-y divide-navy-50">
              {todays.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-xs font-semibold text-navy-700">{t.period}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-navy-900">{t.subject}</p>
                    <p className="truncate text-xs text-navy-400">{t.teacherName}</p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-navy-400">{t.time}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-navy-900">Recently added</h2>
            <div className="flex gap-1">
              <Link to="/student/subjects" className="btn-ghost btn-sm"><BookOpen className="h-3.5 w-3.5" />Materials</Link>
              <Link to="/student/videos" className="btn-ghost btn-sm"><PlayCircle className="h-3.5 w-3.5" />Videos</Link>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {recent.slice(0, 4).map((m) => (
              <MaterialCard key={m.id} m={m} actions={m.category === 'video' ? <Link to="/student/videos" className="btn-outline btn-sm"><PlayCircle className="h-3.5 w-3.5" />Watch</Link> : undefined} />
            ))}
          </div>
        </div>
        <Panel title="Announcements" action={<Link to="/student/notices" className="btn-ghost btn-sm">All</Link>} bodyClassName="p-0">
          {notices.length === 0 ? <EmptyState icon={<Megaphone className="h-6 w-6" />} title="No announcements" /> : (
            <ul className="divide-y divide-navy-50">
              {notices.map((n) => (
                <li key={n.id} className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    {n.priority === 'high' && <Badge tone="red">Important</Badge>}
                    <span className="text-xs text-navy-400">{fmtShort(n.date)}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-navy-900">{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-navy-500">{n.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { to: '/student/exam-prep', label: 'Exam preparation', icon: Award, text: 'Practice quizzes & sample papers' },
          { to: '/student/videos', label: 'Video lectures', icon: PlayCircle, text: 'Learn at your own pace' },
          { to: '/student/results', label: 'Exams & results', icon: CalendarCheck, text: 'Schedule and report card' },
          { to: '/student/notices', label: 'Notices', icon: Megaphone, text: 'Circulars and announcements' },
        ].map((q) => (
          <Link key={q.to} to={q.to} className="card group flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-700 transition group-hover:bg-gold-100 group-hover:text-gold-800"><q.icon className="h-5 w-5" /></span>
            <span className="min-w-0"><span className="block text-sm font-semibold text-navy-900">{q.label}</span><span className="block truncate text-xs text-navy-400">{q.text}</span></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
