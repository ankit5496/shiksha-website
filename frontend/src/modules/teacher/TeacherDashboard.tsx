import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, ClipboardCheck, ClipboardList, Clock, FolderOpen, School, Upload } from 'lucide-react';
import { useCollection } from '@/hooks/useCollection';
import { Avatar, Badge, EmptyState, Panel, Spinner, StatCard, StatusBadge } from '@/components/ui';
import { fmtDate, relativeDay, todayISO, weekdayKey } from '@/utils/format';
import { SubjectIcon, useClassSectionLabel, useTeacher } from '@/modules/lms/_shared';

export default function TeacherDashboard() {
  const { teacher, loading } = useTeacher();
  const { items: timetable } = useCollection('timetable');
  const { items: assignments } = useCollection('assignments');
  const { items: submissions } = useCollection('submissions');
  const { items: materials } = useCollection('materials');
  const { items: students } = useCollection('students');
  const csLabel = useClassSectionLabel();
  const today = todayISO();
  const day = weekdayKey();

  if (loading) return <Spinner />;
  if (!teacher) return <EmptyState title="Teacher profile not found" />;

  const mine = assignments.filter((a) => a.createdBy === teacher.id);
  const mineIds = new Set(mine.map((a) => a.id));
  const toReview = submissions.filter((s) => mineIds.has(s.assignmentId) && s.status !== 'Graded').sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const active = mine.filter((a) => a.dueDate >= today).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const myMaterials = materials.filter((m) => m.uploadedBy === teacher.name);
  const schedule = timetable.filter((t) => t.teacherName === teacher.name && t.day === day).sort((a, b) => a.period - b.period);
  const studentName = (id: string) => students.find((s) => s.id === id)?.name ?? 'Student';
  const assignmentOf = (id: string) => mine.find((a) => a.id === id);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-navy-950 p-6 text-white sm:p-8">
        <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-gold-500/10" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar src={teacher.photo} name={teacher.name} size={64} className="ring-gold-400/40" />
            <div>
              <p className="eyebrow text-gold-300">{fmtDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              <h1 className="mt-1 font-serif text-2xl font-semibold sm:text-3xl">Good day, {teacher.name.split(' ')[0]}</h1>
              <p className="text-sm text-navy-200">{teacher.designation} · {teacher.empId}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/teacher/materials?new=1" className="btn-gold"><Upload className="h-4 w-4" />Upload material</Link>
            <Link to="/teacher/assignments?new=1" className="btn border border-white/20 text-white hover:bg-white/10"><ClipboardList className="h-4 w-4" />Create assignment</Link>
            <Link to="/teacher/attendance" className="btn border border-white/20 text-white hover:bg-white/10"><CalendarCheck className="h-4 w-4" />Mark attendance</Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="My classes" value={teacher.classes.length} icon={<School className="h-5 w-5" />} hint={teacher.subjects.join(', ')} />
        <StatCard label="Pending reviews" value={toReview.length} icon={<ClipboardCheck className="h-5 w-5" />} tone="gold" hint="Submissions to grade" />
        <StatCard label="Active assignments" value={active.length} icon={<ClipboardList className="h-5 w-5" />} tone="blue" hint={`${mine.length} created this term`} />
        <StatCard label="Materials uploaded" value={myMaterials.length} icon={<FolderOpen className="h-5 w-5" />} tone="green" hint="Notes, videos & resources" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Today's schedule" subtitle={fmtDate(today, { weekday: 'long' })} action={<Link to="/teacher/timetable" className="btn-ghost btn-sm">Week</Link>} bodyClassName="p-0">
          {schedule.length === 0 ? <EmptyState icon={<Clock className="h-6 w-6" />} title="No classes scheduled today" /> : (
            <ol className="divide-y divide-navy-50">
              {schedule.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-xs font-semibold text-navy-700">P{t.period}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-navy-900">{t.subject}</p>
                    <p className="text-xs text-navy-400">{csLabel(`${t.classId}-${t.section}`)}</p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-navy-400">{t.time}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel className="xl:col-span-2" title="Submissions awaiting review" action={<Link to="/teacher/submissions" className="btn-ghost btn-sm">Review all<ArrowRight className="h-3.5 w-3.5" /></Link>} bodyClassName="p-0">
          {toReview.length === 0 ? <EmptyState icon={<ClipboardCheck className="h-6 w-6" />} title="All caught up" message="No submissions are waiting for review." /> : (
            <ul className="divide-y divide-navy-50">
              {toReview.slice(0, 6).map((s) => {
                const a = assignmentOf(s.assignmentId);
                return (
                  <li key={s.id}>
                    <Link to={`/teacher/submissions?assignment=${s.assignmentId}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-ivory">
                      <Avatar src={students.find((x) => x.id === s.studentId)?.photo} name={studentName(s.studentId)} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-navy-900">{studentName(s.studentId)}</p>
                        <p className="truncate text-xs text-navy-400">{a?.title} · {a && csLabel(`${a.classId}-${a.section}`)}</p>
                      </div>
                      <span className="hidden text-xs text-navy-400 sm:block">{relativeDay(s.submittedAt)}</span>
                      <StatusBadge status={s.status} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Upcoming deadlines" action={<Link to="/teacher/assignments" className="btn-ghost btn-sm">Manage</Link>} bodyClassName="p-0">
        {active.length === 0 ? <EmptyState title="No upcoming deadlines" action={<Link to="/teacher/assignments?new=1" className="btn-primary btn-sm">Create assignment</Link>} /> : (
          <ul className="grid divide-y divide-navy-50 md:grid-cols-2 md:divide-y-0">
            {active.map((a) => {
              const strength = students.filter((s) => s.classId === a.classId && s.section === a.section).length;
              const count = submissions.filter((s) => s.assignmentId === a.id).length;
              return (
                <li key={a.id} className="flex items-center gap-3 border-navy-50 px-5 py-3.5 md:border-b">
                  <SubjectIcon subject={a.subject} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-navy-900">{a.title}</p>
                    <p className="text-xs text-navy-400">{csLabel(`${a.classId}-${a.section}`)} · Due {fmtDate(a.dueDate)}</p>
                  </div>
                  <Badge tone="navy">{count}/{strength} submitted</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
