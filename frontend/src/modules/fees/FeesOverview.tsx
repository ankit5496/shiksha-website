import { useMemo, useState } from 'react';
import { AlertCircle, CalendarClock, CheckCircle2, Download, IndianRupee, Receipt, Wallet } from 'lucide-react';
import clsx from 'clsx';
import { Badge, Button, DataTable, EmptyState, PageHeader, Panel, ProgressBar, Spinner, StatCard, StatusBadge, type Column } from '@/components/ui';
import { useCollection } from '@/hooks/useCollection';
import { useStudentContext } from '@/hooks/useStudentContext';
import { computeFeeSummary, type InstallmentStatus } from '@/utils/fees';
import { fmtDate, inr, percent, relativeDay } from '@/utils/format';
import { downloadReceipt } from '@/utils/pdf';
import type { Payment } from '@/types';
import PaymentModal from './PaymentModal';

export default function FeesOverview({ standalone }: { standalone?: boolean }) {
  const { student, className, loading } = useStudentContext();
  const { items: structures, loading: l1 } = useCollection('feeStructures');
  const { items: studentFees, loading: l2 } = useCollection('studentFees');
  const { items: payments, loading: l3 } = useCollection('payments');
  const [paying, setPaying] = useState<InstallmentStatus | null>(null);

  const mine = useMemo(() => payments.filter((p) => p.studentId === student?.id).sort((a, b) => b.date.localeCompare(a.date)), [payments, student]);
  const sf = studentFees.find((x) => x.studentId === student?.id);
  const structure = structures.find((s) => s.id === sf?.structureId) ?? structures.find((s) => s.classId === student?.classId);
  const sum = computeFeeSummary(structure, sf, mine);

  if (loading || l1 || l2 || l3) return <Spinner />;
  if (!student) return <EmptyState title="No student linked to this account" />;

  const columns: Column<Payment>[] = [
    { key: 'date', header: 'Date', render: (p) => fmtDate(p.date) },
    { key: 'receiptNo', header: 'Receipt No.', render: (p) => <span className="font-medium">{p.receiptNo}</span> },
    { key: 'installment', header: 'Instalment' },
    { key: 'method', header: 'Mode' },
    { key: 'txnId', header: 'Transaction ID', render: (p) => <span className="font-mono text-xs text-navy-500">{p.txnId}</span> },
    { key: 'amount', header: 'Amount', render: (p) => <span className="font-semibold">{inr(p.amount)}</span>, value: (p) => p.amount },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
  ];

  return (
    <div>
      <PageHeader eyebrow={standalone ? 'Online Fees Portal' : 'Fees'} title={`Fees · ${student.name}`}
        subtitle={`${className}-${student.section} · Admission No. ${student.admissionNo} · Session ${structure?.academicYear ?? ''}`}
        actions={sum.nextDue && <Button variant="gold" icon={<Wallet className="h-4 w-4" />} onClick={() => setPaying(sum.nextDue!)}>Pay {inr(sum.nextDue.amount + sum.nextDue.lateFee)} now</Button>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total annual fees" value={inr(sum.net)} icon={<IndianRupee className="h-5 w-5" />} hint={sum.discountPct ? `After ${sum.discountPct}% concession` : 'Session total'} />
        <StatCard label="Paid so far" value={inr(sum.paid)} tone="green" icon={<CheckCircle2 className="h-5 w-5" />} hint={`${percent(sum.paid, sum.net)}% of annual fees`} />
        <StatCard label="Outstanding" value={inr(sum.outstanding)} tone={sum.outstanding ? 'red' : 'green'} icon={<AlertCircle className="h-5 w-5" />} hint={sum.lateFeeTotal ? `incl. late fee ${inr(sum.lateFeeTotal)}` : 'No late fee'} />
        <StatCard label="Next due date" value={sum.nextDue ? fmtDate(sum.nextDue.dueDate, { day: 'numeric', month: 'short' }) : 'All paid'} tone="gold" icon={<CalendarClock className="h-5 w-5" />}
          hint={sum.nextDue ? `${sum.nextDue.label} · ${relativeDay(sum.nextDue.dueDate)}` : 'Thank you!'} />
      </div>

      <div className="mt-5 card p-5">
        <div className="flex items-center justify-between text-sm"><span className="font-semibold text-navy-800">Payment progress</span><span className="text-navy-500">{inr(sum.paid)} of {inr(sum.net)}</span></div>
        <ProgressBar value={percent(sum.paid, sum.net)} tone="gold" className="mt-3 h-2.5" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Instalment schedule" subtitle="Quarterly instalments for the session">
          <ul className="divide-y divide-navy-50">
            {sum.installments.map((i) => (
              <li key={i.label} className="flex flex-col gap-3 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className={clsx('flex h-10 w-10 items-center justify-center rounded-xl', i.paid ? 'bg-emerald-50 text-emerald-600' : i.overdue ? 'bg-red-50 text-red-600' : 'bg-gold-50 text-gold-700')}>
                    {i.paid ? <CheckCircle2 className="h-5 w-5" /> : <CalendarClock className="h-5 w-5" />}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-navy-900">{i.label}</p>
                    <p className="text-xs text-navy-400">Due {fmtDate(i.dueDate)}{i.paid && i.payment ? ` · Paid on ${fmtDate(i.payment.date)}` : ''}{i.overdue ? ` · ${i.daysOverdue} days overdue` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:justify-end">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-navy-900">{inr(i.amount + i.lateFee)}</p>
                    {i.lateFee > 0 && <p className="text-[11px] text-red-600">+{inr(i.lateFee)} late fee</p>}
                  </div>
                  {i.paid ? <Badge tone="green" dot>Paid</Badge> : i.overdue ? <Badge tone="red" dot>Overdue</Badge> : <Badge tone="amber" dot>Due</Badge>}
                  {i.paid && i.payment ? (
                    <Button size="sm" variant="ghost" onClick={() => downloadReceipt(i.payment!, student, className)} aria-label="Download receipt"><Download className="h-4 w-4" /></Button>
                  ) : (
                    <Button size="sm" variant={i === sum.nextDue ? 'gold' : 'outline'} onClick={() => setPaying(i)}>Pay</Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Fee breakdown" subtitle="Demo fee structure – subject to school confirmation">
          <dl className="space-y-2.5 text-sm">
            {sum.items.map((it) => (
              <div key={it.category} className="flex justify-between"><dt className="text-navy-600">{it.category}</dt><dd className="font-medium text-navy-900">{inr(it.amount)}</dd></div>
            ))}
            {sum.discountAmount > 0 && <div className="flex justify-between text-emerald-700"><dt>Concession ({sum.discountPct}%{sf?.discountReason ? ` · ${sf.discountReason}` : ''})</dt><dd>− {inr(sum.discountAmount)}</dd></div>}
            {sum.transportFee > 0 && <div className="flex justify-between"><dt className="text-navy-600">Transport fee</dt><dd className="font-medium text-navy-900">{inr(sum.transportFee)}</dd></div>}
            {sum.lateFeeTotal > 0 && <div className="flex justify-between text-red-600"><dt>Late fee</dt><dd>{inr(sum.lateFeeTotal)}</dd></div>}
            <div className="flex justify-between border-t border-navy-100 pt-3 text-base"><dt className="font-semibold text-navy-900">Net payable</dt><dd className="font-serif font-semibold text-navy-900">{inr(sum.net)}</dd></div>
          </dl>
        </Panel>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center gap-2"><Receipt className="h-4 w-4 text-gold-600" /><h2 className="text-[15px] font-semibold text-navy-900">Payment history</h2></div>
        <DataTable rows={mine} columns={columns} searchPlaceholder="Search receipts…" pageSize={6} emptyTitle="No payments yet"
          actions={(p) => p.status === 'Success'
            ? <Button size="sm" variant="outline" icon={<Download className="h-3.5 w-3.5" />} onClick={() => downloadReceipt(p, student, className)}>Receipt</Button>
            : <Button size="sm" variant="ghost" onClick={() => { const ins = sum.installments.find((i) => i.label === p.installment && !i.paid); if (ins) setPaying(ins); }}>Retry</Button>} />
      </div>

      <PaymentModal open={!!paying} onClose={() => setPaying(null)} student={student} className={className} installment={paying} />
    </div>
  );
}
