import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Check, Inbox, Receipt, X } from 'lucide-react';
import type { AttendanceRecord, LeaveRequest } from '@/types';
import { useCollection } from '@/hooks/useCollection';
import { useToast } from '@/context/ToastContext';
import { Avatar, Badge, EmptyState, Panel, StatusBadge } from '@/components/ui';
import { computeFeeSummary } from '@/utils/fees';
import { fmtDate, inr, parseISO, percent, relativeDay, toISO, todayISO } from '@/utils/format';
import { useClasses, useStaff } from './_shared';

/** Aggregated school-wide figures for staff dashboards. */
export function useSchoolStats() {
  const { items: students } = useCollection('students');
  const { items: teachers } = useCollection('teachers');
  const { items: attendance } = useCollection('attendance');
  const { items: payments } = useCollection('payments');
  const { items: structures } = useCollection('feeStructures');
  const { items: studentFees } = useCollection('studentFees');
  const { items: buses } = useCollection('buses');
  const { items: enquiries } = useCollection('enquiries');
  const { items: leaves } = useCollection('leaves');

  return useMemo(() => {
    const active = students.filter((s) => s.status === 'Active');
    const today = todayISO();
    const dates = [...new Set(attendance.map((a) => a.date))].sort();
    const attDate = dates.includes(today) ? today : dates[dates.length - 1];
    const dayRecs = attendance.filter((a: AttendanceRecord) => a.date === attDate && a.status !== 'H');
    const attPct = percent(dayRecs.filter((a) => a.status === 'P').length, dayRecs.length);
    let expected = 0; let collected = 0;
    active.forEach((s) => {
      const sf = studentFees.find((x) => x.studentId === s.id);
      const fs = structures.find((x) => x.id === sf?.structureId) ?? structures.find((x) => x.classId === s.classId);
      const sum = computeFeeSummary(fs, sf, payments.filter((p) => p.studentId === s.id));
      expected += sum.net; collected += sum.paid;
    });
    const ok = payments.filter((p) => p.status === 'Success');
    return {
      students: active.length, teachers: teachers.filter((t) => t.status !== 'Inactive').length, teachersOnLeave: teachers.filter((t) => t.status === 'On Leave').length,
      attPct, attDate, attIsToday: attDate === today, expected, collected, outstanding: Math.max(0, expected - collected),
      busesActive: buses.filter((b) => b.status === 'Active').length, busesTotal: buses.length,
      newEnquiries: enquiries.filter((e) => e.status === 'New').length, pendingLeaves: leaves.filter((l) => l.status === 'Pending').length,
      todayCollection: ok.filter((p) => p.date === today).reduce((a, b) => a + b.amount, 0), todayReceipts: ok.filter((p) => p.date === today).length,
      activeStudents: active,
    };
  }, [students, teachers, attendance, payments, structures, studentFees, buses, enquiries, leaves]);
}

export function PendingLeavesPanel({ limit = 5 }: { limit?: number }) {
  const { items: leaves, update } = useCollection('leaves');
  const { items: students } = useCollection('students');
  const attendance = useCollection('attendance');
  const { name: className } = useClasses();
  const { base } = useStaff();
  const toast = useToast();
  const pending = leaves.filter((l) => l.status === 'Pending').sort((a, b) => a.fromDate.localeCompare(b.fromDate));
  const decide = async (l: LeaveRequest, status: 'Approved' | 'Rejected') => {
    await update(l.id, { status });
    if (status === 'Approved') {
      const recs: AttendanceRecord[] = [];
      for (let d = parseISO(l.fromDate); d <= parseISO(l.toDate); d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== 0) { const ds = toISO(d); recs.push({ id: `at-${l.studentId}-${ds}`, studentId: l.studentId, date: ds, status: 'L', markedBy: 'Leave approval' }); }
      }
      if (recs.length) await attendance.bulkUpsert(recs);
    }
    toast.success(`Leave ${status.toLowerCase()}`, students.find((s) => s.id === l.studentId)?.name);
  };
  return (
    <Panel title="Pending leave approvals" subtitle={`${pending.length} awaiting decision`} bodyClassName="p-0"
      action={<Link to={`${base}/attendance`} className="text-xs font-semibold text-navy-500 hover:text-navy-900">View all</Link>}>
      {pending.length === 0 ? <EmptyState title="No pending requests" message="All leave applications have been processed." /> : (
        <ul className="divide-y divide-navy-50">
          {pending.slice(0, limit).map((l) => {
            const s = students.find((x) => x.id === l.studentId);
            return (
              <li key={l.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar src={s?.photo} name={s?.name ?? '?'} size={34} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{s?.name} <span className="font-normal text-navy-400">· {className(s?.classId)}-{s?.section}</span></p>
                    <p className="truncate text-xs text-navy-500">{l.type} · {fmtDate(l.fromDate)}{l.toDate !== l.fromDate && ` – ${fmtDate(l.toDate)}`} · {l.reason}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5 pl-12 sm:pl-0">
                  <button onClick={() => decide(l, 'Approved')} className="btn-sm btn bg-emerald-50 text-emerald-700 hover:bg-emerald-100"><Check className="h-3.5 w-3.5" />Approve</button>
                  <button onClick={() => decide(l, 'Rejected')} className="btn-sm btn bg-red-50 text-red-700 hover:bg-red-100"><X className="h-3.5 w-3.5" />Reject</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

export function RecentPaymentsPanel({ limit = 6, todayOnly }: { limit?: number; todayOnly?: boolean }) {
  const { items: payments } = useCollection('payments');
  const { items: students } = useCollection('students');
  const { name: className } = useClasses();
  const { base } = useStaff();
  const list = payments.filter((p) => !todayOnly || p.date === todayISO()).sort((a, b) => b.date.localeCompare(a.date) || b.receiptNo.localeCompare(a.receiptNo)).slice(0, limit);
  return (
    <Panel title={todayOnly ? "Today's collections" : 'Recent payments'} bodyClassName="p-0"
      action={<Link to={`${base}/fees`} className="text-xs font-semibold text-navy-500 hover:text-navy-900">Fee management</Link>}>
      {list.length === 0 ? <EmptyState title={todayOnly ? 'No collections yet today' : 'No payments'} icon={<Receipt className="h-6 w-6" />} message={todayOnly ? 'Payments recorded at the counter or online will appear here.' : undefined} /> : (
        <ul className="divide-y divide-navy-50">
          {list.map((p) => {
            const s = students.find((x) => x.id === p.studentId);
            return (
              <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar src={s?.photo} name={s?.name ?? '?'} size={32} />
                  <div className="min-w-0"><p className="truncate text-sm font-semibold">{s?.name ?? 'Unknown'}</p><p className="truncate text-xs text-navy-400">{className(s?.classId)} · {p.method} · {relativeDay(p.date)}</p></div>
                </div>
                <div className="text-right"><p className="text-sm font-semibold">{inr(p.amount)}</p><StatusBadge status={p.status} /></div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

export function EnquiriesPanel({ limit = 4 }: { limit?: number }) {
  const { items } = useCollection('enquiries');
  const { base } = useStaff();
  const list = [...items].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
  return (
    <Panel title="Latest enquiries" bodyClassName="p-0" action={<Link to={`${base}/enquiries`} className="text-xs font-semibold text-navy-500 hover:text-navy-900">Open inbox</Link>}>
      {list.length === 0 ? <EmptyState title="No enquiries" icon={<Inbox className="h-6 w-6" />} /> : (
        <ul className="divide-y divide-navy-50">
          {list.map((e) => (
            <li key={e.id} className="px-5 py-3">
              <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-semibold">{e.name}</p><StatusBadge status={e.status} /></div>
              <p className="mt-0.5 truncate text-xs text-navy-500">{e.kind === 'admission' ? <Badge tone="gold" className="mr-1">{e.classApplying}</Badge> : null}{e.message}</p>
              <p className="mt-1 text-[11px] text-navy-400">{relativeDay(e.date)} · {e.phone}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
