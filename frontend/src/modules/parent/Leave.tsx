import { useState } from 'react';
import { FileText, Send } from 'lucide-react';
import type { LeaveRequest } from '@/types';
import { Button, ConfirmDialog, DataTable, EmptyState, Field, Input, PageHeader, Panel, Select, Spinner, StatusBadge, Textarea, type Column } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { useCollection } from '@/hooks/useCollection';
import { useForm, v } from '@/hooks/useForm';
import { useStudentContext } from '@/hooks/useStudentContext';
import { daysBetween, fmtDate, todayISO } from '@/utils/format';

const blank = { type: 'Sick', fromDate: todayISO(), toDate: todayISO(), reason: '' };

export default function Leave() {
  const { student, loading } = useStudentContext();
  const { items: leaves, loading: ll, create, update } = useCollection('leaves');
  const toast = useToast();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const f = useForm(blank, {
    type: [v.required()],
    fromDate: [v.required()],
    toDate: [v.required(), (val, all) => (String(val) < String(all.fromDate) ? 'End date cannot be before start date' : undefined)],
    reason: [v.required('Please describe the reason'), v.minLength(10, 'Please give a little more detail (min 10 characters)')],
  });

  if (loading || ll) return <Spinner />;
  if (!student) return <EmptyState title="No student linked" />;
  const mine = leaves.filter((l) => l.studentId === student.id).sort((a, b) => b.appliedOn.localeCompare(a.appliedOn));

  const submit = f.handleSubmit(async (vals) => {
    await create({ studentId: student.id, type: vals.type as LeaveRequest['type'], fromDate: vals.fromDate, toDate: vals.toDate, reason: vals.reason.trim(), status: 'Pending', appliedOn: todayISO() });
    toast.success('Leave application submitted', 'The class teacher will review it shortly.');
    f.reset({ ...blank });
  });

  const cols: Column<LeaveRequest>[] = [
    { key: 'appliedOn', header: 'Applied on', render: (l) => fmtDate(l.appliedOn) },
    { key: 'type', header: 'Type' },
    { key: 'fromDate', header: 'Period', render: (l) => `${fmtDate(l.fromDate, { day: 'numeric', month: 'short' })} – ${fmtDate(l.toDate, { day: 'numeric', month: 'short' })}` },
    { key: 'days', header: 'Days', value: (l) => daysBetween(l.fromDate, l.toDate) + 1 },
    { key: 'reason', header: 'Reason', render: (l) => <span className="line-clamp-1 max-w-xs">{l.reason}</span> },
    { key: 'status', header: 'Status', render: (l) => <StatusBadge status={l.status} /> },
  ];

  return (
    <div>
      <PageHeader eyebrow="Leave" title="Leave Application" subtitle={`Apply for leave on behalf of ${student.name}.`} />
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Panel title="New application" action={<FileText className="h-4 w-4 text-gold-600" />}>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <Field label="Leave type" required error={f.errors.type}>
              <Select {...f.bind('type')} options={[{ value: 'Sick', label: 'Sick leave' }, { value: 'Family', label: 'Family function / travel' }, { value: 'Other', label: 'Other' }]} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="From" required error={f.errors.fromDate}><Input type="date" {...f.bind('fromDate')} /></Field>
              <Field label="To" required error={f.errors.toDate}><Input type="date" min={f.values.fromDate} {...f.bind('toDate')} /></Field>
            </div>
            <Field label="Reason" required error={f.errors.reason}><Textarea placeholder="e.g. Fever – doctor has advised two days of rest." {...f.bind('reason')} /></Field>
            <Button type="submit" className="w-full" loading={f.submitting} icon={<Send className="h-4 w-4" />}>Submit application</Button>
          </form>
        </Panel>
        <div>
          <h2 className="mb-3 text-[15px] font-semibold text-navy-900">My applications</h2>
          <DataTable rows={mine} columns={cols} pageSize={6} searchPlaceholder="Search applications…" emptyTitle="No leave applications yet"
            actions={(l) => l.status === 'Pending' ? <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setCancelId(l.id)}>Withdraw</Button> : <span className="text-xs text-navy-300">—</span>} />
        </div>
      </div>
      <ConfirmDialog open={!!cancelId} onClose={() => setCancelId(null)} title="Withdraw application?" message="This pending leave application will be withdrawn and marked as rejected."
        confirmLabel="Withdraw" onConfirm={async () => { if (cancelId) { await update(cancelId, { status: 'Rejected', reason: `${mine.find((m) => m.id === cancelId)?.reason ?? ''} (withdrawn by parent)` }); toast.info('Application withdrawn'); } setCancelId(null); }} />
    </div>
  );
}
