import { useEffect, useMemo, useState } from 'react';
import { Check, CheckCheck, Download, FileText, Save, X, CalendarCheck, UserX, Clock3, Users } from 'lucide-react';
import clsx from 'clsx';
import type { AttendanceRecord, AttendanceStatus, LeaveRequest } from '@/types';
import { useCollection } from '@/hooks/useCollection';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Avatar, Badge, Button, DataTable, EmptyState, Field, Input, PageHeader, Panel, Select, StatCard, StatusBadge, Tabs, Spinner, type Column } from '@/components/ui';
import { downloadText, fmtDate, parseISO, percent, toCSV, toISO, todayISO } from '@/utils/format';
import { downloadReportPdf } from '@/utils/pdf';
import { useClasses } from './_shared';

const STATUS_META: Record<AttendanceStatus, { label: string; cls: string }> = {
  P: { label: 'Present', cls: 'bg-emerald-600 text-white ring-emerald-600' },
  A: { label: 'Absent', cls: 'bg-red-600 text-white ring-red-600' },
  L: { label: 'Leave', cls: 'bg-amber-500 text-white ring-amber-500' },
  H: { label: 'Holiday', cls: 'bg-navy-400 text-white ring-navy-400' },
};

/** Class-section options limited to sections that have students (or to an allowed list). */
function useSectionOptions(allowed?: string[]) {
  const { classSections, classes } = useClasses();
  const { items: students } = useCollection('students');
  return useMemo(() => {
    const withStudents = new Set(students.map((s) => `${s.classId}-${s.section}`));
    let opts = classSections.filter((o) => withStudents.has(o.value));
    if (allowed) opts = classSections.filter((o) => allowed.includes(o.value));
    return opts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classSections, students, allowed?.join(','), classes]);
}

const splitCS = (cs: string) => { const i = cs.lastIndexOf('-'); return [cs.slice(0, i), cs.slice(i + 1)] as const; };

/** Reusable attendance marking UI (used by Admin/Office and the Teacher portal). */
export function MarkAttendancePanel({ allowedClassSections }: { allowedClassSections?: string[] }) {
  const options = useSectionOptions(allowedClassSections);
  const { items: students, loading } = useCollection('students');
  const attendance = useCollection('attendance');
  const { user } = useAuth();
  const toast = useToast();
  const [date, setDate] = useState(todayISO());
  const [cs, setCs] = useState('');
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { if (!cs && options.length) setCs(options[0].value); }, [options, cs]);
  const [classId, section] = cs ? splitCS(cs) : ['', ''];
  const roster = useMemo(() => students.filter((s) => s.classId === classId && s.section === section && s.status === 'Active').sort((a, b) => a.rollNo - b.rollNo), [students, classId, section]);
  const existing = useMemo(() => {
    const m = new Map<string, AttendanceRecord>();
    attendance.items.forEach((a) => { if (a.date === date) m.set(a.studentId, a); });
    return m;
  }, [attendance.items, date]);
  const alreadyMarked = roster.some((s) => existing.has(s.id));

  useEffect(() => {
    const m: Record<string, AttendanceStatus> = {};
    roster.forEach((s) => { m[s.id] = existing.get(s.id)?.status ?? 'P'; });
    setMarks(m);
    setDirty(false);
  }, [roster, existing]);

  const isSunday = parseISO(date).getDay() === 0;
  const set = (id: string, st: AttendanceStatus) => { setMarks((m) => ({ ...m, [id]: st })); setDirty(true); };
  const counts = { P: 0, A: 0, L: 0, H: 0 } as Record<AttendanceStatus, number>;
  Object.values(marks).forEach((s) => { counts[s]++; });

  const save = async () => {
    if (!roster.length) return;
    setSaving(true);
    try {
      await attendance.bulkUpsert(roster.map((s) => ({ id: `at-${s.id}-${date}`, studentId: s.id, date, status: marks[s.id] ?? 'P', markedBy: user?.name })));
      setDirty(false);
      toast.success('Attendance saved', `${options.find((o) => o.value === cs)?.label} · ${fmtDate(date)} — ${counts.P} present, ${counts.A} absent, ${counts.L} on leave.`);
    } catch (e) { toast.error('Could not save attendance', (e as Error).message); } finally { setSaving(false); }
  };

  if (!options.length && !loading) return <Panel><EmptyState title="No classes assigned" message="You have no class-sections assigned for attendance." /></Panel>;

  return (
    <Panel bodyClassName="p-0"
      title="Mark attendance" subtitle={alreadyMarked ? 'Attendance already recorded for this date – changes will update it.' : 'Unmarked students default to Present.'}
      action={<Badge tone={alreadyMarked ? 'green' : 'amber'} dot>{alreadyMarked ? 'Recorded' : 'Not yet marked'}</Badge>}>
      <div className="grid gap-3 border-b border-navy-50 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Date"><Input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value || todayISO())} /></Field>
        <Field label="Class & section"><Select value={cs} onChange={(e) => setCs(e.target.value)} options={options} /></Field>
        <Button variant="outline" icon={<CheckCheck className="h-4 w-4" />} onClick={() => { const m: Record<string, AttendanceStatus> = {}; roster.forEach((s) => { m[s.id] = 'P'; }); setMarks(m); setDirty(true); }}>Mark all present</Button>
      </div>
      {isSunday && <p className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-800">The selected date is a Sunday. Attendance is usually not taken on Sundays.</p>}
      {loading || attendance.loading ? <Spinner /> : roster.length === 0 ? <EmptyState title="No students in this section" /> : (
        <ul className="divide-y divide-navy-50">
          {roster.map((s) => (
            <li key={s.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="w-7 text-center text-xs font-semibold text-navy-400">{s.rollNo}</span>
                <Avatar src={s.photo} name={s.name} size={34} />
                <div><p className="text-sm font-semibold text-navy-900">{s.name}</p><p className="text-xs text-navy-400">{s.admissionNo}</p></div>
              </div>
              <div className="flex gap-1.5 pl-10 sm:pl-0" role="radiogroup" aria-label={`Attendance for ${s.name}`}>
                {(['P', 'A', 'L'] as AttendanceStatus[]).map((st) => (
                  <button key={st} role="radio" aria-checked={marks[s.id] === st} onClick={() => set(s.id, st)}
                    className={clsx('min-w-[76px] rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition', marks[s.id] === st ? STATUS_META[st].cls : 'bg-white text-navy-500 ring-navy-100 hover:ring-navy-300')}>
                    {STATUS_META[st].label}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-3 border-t border-navy-50 bg-mist/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge tone="green">{counts.P} Present</Badge><Badge tone="red">{counts.A} Absent</Badge><Badge tone="amber">{counts.L} Leave</Badge>
          <Badge tone="grey">{percent(counts.P, roster.length)}% attendance</Badge>
        </div>
        <Button icon={<Save className="h-4 w-4" />} loading={saving} disabled={!roster.length} onClick={save}>{dirty || !alreadyMarked ? 'Save attendance' : 'Saved'}</Button>
      </div>
    </Panel>
  );
}

function DailyView() {
  const options = useSectionOptions();
  const { items: students } = useCollection('students');
  const { items: attendance, loading } = useCollection('attendance');
  const { name: className } = useClasses();
  const [date, setDate] = useState(todayISO());
  const [cs, setCs] = useState('');
  const [st, setSt] = useState('');
  const recs = new Map(attendance.filter((a) => a.date === date).map((a) => [a.studentId, a]));
  const pool = students.filter((s) => s.status === 'Active' && (!cs || `${s.classId}-${s.section}` === cs));
  type Row = { id: string; name: string; photo?: string; cls: string; roll: number; status: string };
  const rows: Row[] = pool.map((s) => {
    const r = recs.get(s.id);
    return { id: s.id, name: s.name, photo: s.photo, cls: `${className(s.classId)} – ${s.section}`, roll: s.rollNo, status: r ? STATUS_META[r.status].label : 'Not marked' };
  }).filter((r) => !st || r.status === st);
  const c = (label: string) => pool.filter((s) => { const r = recs.get(s.id); return label === 'Not marked' ? !r : r && STATUS_META[r.status].label === label; }).length;
  const columns: Column<Row>[] = [
    { key: 'name', header: 'Student', render: (r) => <div className="flex items-center gap-2"><Avatar src={r.photo} name={r.name} size={30} /><span className="font-medium">{r.name}</span></div> },
    { key: 'cls', header: 'Class' },
    { key: 'roll', header: 'Roll' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Present" value={c('Present')} icon={<Check className="h-5 w-5" />} tone="green" hint={`${percent(c('Present'), pool.length)}% of ${pool.length}`} />
        <StatCard label="Absent" value={c('Absent')} icon={<UserX className="h-5 w-5" />} tone="red" />
        <StatCard label="On leave" value={c('Leave')} icon={<Clock3 className="h-5 w-5" />} tone="gold" />
        <StatCard label="Not marked" value={c('Not marked')} icon={<Users className="h-5 w-5" />} tone="blue" />
      </div>
      <DataTable rows={rows} columns={columns} loading={loading} searchPlaceholder="Search student…"
        toolbar={<>
          <Input type="date" className="w-40" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value || todayISO())} aria-label="Date" />
          <Select className="w-40" value={cs} onChange={(e) => setCs(e.target.value)} placeholder="All classes" options={options} aria-label="Class" />
          <Select className="w-36" value={st} onChange={(e) => setSt(e.target.value)} placeholder="Any status" options={['Present', 'Absent', 'Leave', 'Holiday', 'Not marked'].map((x) => ({ value: x, label: x }))} aria-label="Status" />
        </>} />
    </div>
  );
}

function MonthlyReport() {
  const options = useSectionOptions();
  const { items: students } = useCollection('students');
  const { items: attendance, loading } = useCollection('attendance');
  const toast = useToast();
  const [cs, setCs] = useState('');
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  useEffect(() => { if (!cs && options.length) setCs(options[0].value); }, [options, cs]);
  const [classId, section] = cs ? splitCS(cs) : ['', ''];
  const label = options.find((o) => o.value === cs)?.label ?? '';
  type Row = { id: string; roll: number; name: string; P: number; A: number; L: number; days: number; pct: number };
  const rows: Row[] = useMemo(() => {
    const monthRecs = attendance.filter((a) => a.date.startsWith(month) && a.status !== 'H');
    return students.filter((s) => s.classId === classId && s.section === section).sort((a, b) => a.rollNo - b.rollNo).map((s) => {
      const r = monthRecs.filter((a) => a.studentId === s.id);
      const P = r.filter((x) => x.status === 'P').length, A = r.filter((x) => x.status === 'A').length, L = r.filter((x) => x.status === 'L').length;
      return { id: s.id, roll: s.rollNo, name: s.name, P, A, L, days: r.length, pct: percent(P, r.length) };
    });
  }, [attendance, students, classId, section, month]);
  const monthLabel = parseISO(`${month}-01`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const columns: Column<Row>[] = [
    { key: 'roll', header: 'Roll' }, { key: 'name', header: 'Student' },
    { key: 'days', header: 'Working days' }, { key: 'P', header: 'Present' }, { key: 'A', header: 'Absent' }, { key: 'L', header: 'Leave' },
    { key: 'pct', header: 'Attendance %', render: (r) => <Badge tone={r.days === 0 ? 'grey' : r.pct >= 90 ? 'green' : r.pct >= 75 ? 'amber' : 'red'}>{r.days ? `${r.pct}%` : '—'}</Badge> },
  ];
  const csv = () => {
    downloadText(`attendance-${cs}-${month}.csv`, toCSV(rows, [{ key: 'roll', label: 'Roll' }, { key: 'name', label: 'Student' }, { key: 'days', label: 'Working days' }, { key: 'P', label: 'Present' }, { key: 'A', label: 'Absent' }, { key: 'L', label: 'Leave' }, { key: 'pct', label: 'Attendance %' }]), 'text/csv');
    toast.success('CSV downloaded');
  };
  const pdf = () => {
    downloadReportPdf(`Monthly Attendance – ${label} – ${monthLabel}`, ['Roll', 'Student', 'Days', 'Present', 'Absent', 'Leave', '%'], rows.map((r) => [r.roll, r.name, r.days, r.P, r.A, r.L, `${r.pct}%`]), `attendance-${cs}-${month}.pdf`);
    toast.success('PDF report downloaded');
  };
  const avg = rows.length ? Math.round(rows.reduce((a, b) => a + b.pct, 0) / rows.length) : 0;
  return (
    <div className="space-y-4">
      <div className="card flex flex-col gap-3 p-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:max-w-lg">
          <Field label="Class & section"><Select value={cs} onChange={(e) => setCs(e.target.value)} options={options} /></Field>
          <Field label="Month"><Input type="month" value={month} max={todayISO().slice(0, 7)} onChange={(e) => setMonth(e.target.value || todayISO().slice(0, 7))} /></Field>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="navy">Class average: {avg}%</Badge>
          <Button variant="outline" icon={<Download className="h-4 w-4" />} onClick={csv} disabled={!rows.length}>CSV</Button>
          <Button icon={<FileText className="h-4 w-4" />} onClick={pdf} disabled={!rows.length}>PDF report</Button>
        </div>
      </div>
      <DataTable rows={rows} columns={columns} loading={loading} pageSize={25} searchable={false} emptyTitle="No students in this section" />
    </div>
  );
}

export function LeaveRequests() {
  const { items: leaves, loading, update } = useCollection('leaves');
  const { items: students } = useCollection('students');
  const attendance = useCollection('attendance');
  const { name: className } = useClasses();
  const toast = useToast();
  const [filter, setFilter] = useState('Pending');
  const rows = leaves.filter((l) => !filter || l.status === filter).sort((a, b) => b.appliedOn.localeCompare(a.appliedOn));
  const st = (id: string) => students.find((s) => s.id === id);

  const decide = async (l: LeaveRequest, status: 'Approved' | 'Rejected') => {
    await update(l.id, { status });
    if (status === 'Approved') {
      const recs: AttendanceRecord[] = [];
      for (let d = parseISO(l.fromDate); d <= parseISO(l.toDate); d.setDate(d.getDate() + 1)) {
        if (d.getDay() === 0) continue;
        const ds = toISO(d);
        recs.push({ id: `at-${l.studentId}-${ds}`, studentId: l.studentId, date: ds, status: 'L', markedBy: 'Leave approval' });
      }
      if (recs.length) await attendance.bulkUpsert(recs);
    }
    toast.success(`Leave ${status.toLowerCase()}`, `${st(l.studentId)?.name ?? 'Student'} · ${fmtDate(l.fromDate)}${l.toDate !== l.fromDate ? ` – ${fmtDate(l.toDate)}` : ''}`);
  };

  const columns: Column<LeaveRequest>[] = [
    { key: 'student', header: 'Student', value: (l) => st(l.studentId)?.name ?? '', render: (l) => { const s = st(l.studentId); return s ? <div className="flex items-center gap-2"><Avatar src={s.photo} name={s.name} size={30} /><div><p className="font-medium">{s.name}</p><p className="text-xs text-navy-400">{className(s.classId)} – {s.section}</p></div></div> : '—'; } },
    { key: 'type', header: 'Type', render: (l) => <Badge tone="navy">{l.type}</Badge> },
    { key: 'dates', header: 'Dates', value: (l) => l.fromDate, render: (l) => <span className="whitespace-nowrap">{fmtDate(l.fromDate)}{l.toDate !== l.fromDate && ` – ${fmtDate(l.toDate)}`}</span> },
    { key: 'reason', header: 'Reason', render: (l) => <span className="line-clamp-2 max-w-xs text-navy-600">{l.reason}</span> },
    { key: 'appliedOn', header: 'Applied', render: (l) => fmtDate(l.appliedOn) },
    { key: 'status', header: 'Status', render: (l) => <StatusBadge status={l.status} /> },
  ];
  return (
    <DataTable rows={rows} columns={columns} loading={loading} emptyTitle={filter === 'Pending' ? 'No pending leave requests' : 'No leave requests'}
      toolbar={<Select className="w-36" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="All" options={['Pending', 'Approved', 'Rejected'].map((s) => ({ value: s, label: s }))} aria-label="Filter" />}
      actions={(l) => l.status === 'Pending' ? <>
        <Button size="sm" variant="outline" icon={<Check className="h-3.5 w-3.5 text-emerald-600" />} onClick={() => decide(l, 'Approved')}>Approve</Button>
        <Button size="sm" variant="ghost" icon={<X className="h-3.5 w-3.5 text-red-600" />} onClick={() => decide(l, 'Rejected')}>Reject</Button>
      </> : <span className="text-xs text-navy-300">—</span>} />
  );
}

type Tab = 'mark' | 'daily' | 'monthly' | 'leaves';
export default function AttendanceManagement() {
  const [tab, setTab] = useState<Tab>('mark');
  const { items: leaves } = useCollection('leaves');
  return (
    <div>
      <PageHeader eyebrow="Attendance Management" title="Attendance" subtitle="Mark daily attendance, review records and generate monthly reports"
        actions={<Badge tone="gold"><CalendarCheck className="h-3.5 w-3.5" />{fmtDate(todayISO(), { weekday: 'long', day: 'numeric', month: 'long' })}</Badge>} />
      <Tabs className="mb-5 w-fit max-w-full" value={tab} onChange={setTab} tabs={[
        { value: 'mark', label: 'Mark Attendance' }, { value: 'daily', label: 'Daily View' }, { value: 'monthly', label: 'Monthly Report' },
        { value: 'leaves', label: 'Leave Requests', count: leaves.filter((l) => l.status === 'Pending').length },
      ]} />
      {tab === 'mark' && <MarkAttendancePanel />}
      {tab === 'daily' && <DailyView />}
      {tab === 'monthly' && <MonthlyReport />}
      {tab === 'leaves' && <LeaveRequests />}
    </div>
  );
}
