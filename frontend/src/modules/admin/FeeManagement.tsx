import { useMemo, useState } from 'react';
import { AlertTriangle, Download, FileText, IndianRupee, Pencil, Plus, Receipt, Trash2, TrendingUp, Wallet, CheckCircle2 } from 'lucide-react';
import type { FeeItem, FeeStructure, Installment, Payment, PaymentMethod, Student, StudentFee } from '@/types';
import { useCollection } from '@/hooks/useCollection';
import { useForm, v } from '@/hooks/useForm';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import {
  Avatar, Badge, Button, ConfirmDialog, DataTable, EmptyState, Field, Input, Modal, PageHeader, Panel, ProgressBar, SearchSelect, Select, StatCard, StatusBadge, Tabs, Textarea, type Column,
} from '@/components/ui';
import { computeFeeSummary, type FeeSummary } from '@/utils/fees';
import { downloadText, fmtDate, inr, percent, toCSV, todayISO } from '@/utils/format';
import { downloadReceipt, downloadReportPdf } from '@/utils/pdf';
import { BarList, ColumnChart, nextReceiptNo, useClasses, useStaff } from './_shared';

type FeeStatus = 'Paid' | 'Partial' | 'Overdue' | 'Pending';
interface Row { id: string; student: Student; sf?: StudentFee; summary: FeeSummary; status: FeeStatus }

function useFeeData() {
  const students = useCollection('students');
  const structures = useCollection('feeStructures');
  const studentFees = useCollection('studentFees');
  const payments = useCollection('payments');
  const rows: Row[] = useMemo(() => students.items.filter((s) => s.status === 'Active').map((s) => {
    const sf = studentFees.items.find((x) => x.studentId === s.id);
    const fs = structures.items.find((x) => x.id === sf?.structureId) ?? structures.items.find((x) => x.classId === s.classId);
    const summary = computeFeeSummary(fs, sf, payments.items.filter((p) => p.studentId === s.id));
    const status: FeeStatus = summary.outstanding <= 0 ? 'Paid' : summary.installments.some((i) => i.overdue) ? 'Overdue' : summary.paid > 0 ? 'Partial' : 'Pending';
    return { id: s.id, student: s, sf, summary, status };
  }), [students.items, structures.items, studentFees.items, payments.items]);
  return { rows, students, structures, studentFees, payments, loading: students.loading || structures.loading || payments.loading };
}

// ---------------- Overview ----------------
function Overview({ data }: { data: ReturnType<typeof useFeeData> }) {
  const { name: className, classes } = useClasses();
  const { rows, payments } = data;
  const expected = rows.reduce((a, r) => a + r.summary.net, 0);
  const collected = rows.reduce((a, r) => a + r.summary.paid, 0);
  const outstanding = rows.reduce((a, r) => a + r.summary.outstanding, 0);
  const defaulters = rows.filter((r) => r.status === 'Overdue');
  const ok = payments.items.filter((p) => p.status === 'Success');
  const months = ['04', '05', '06', '07', '08', '09', '10', '11', '12', '01', '02', '03'];
  const monthly = months.map((m) => ({ label: new Date(2026, Number(m) - 1, 1).toLocaleDateString('en-IN', { month: 'short' }), value: ok.filter((p) => p.date.slice(5, 7) === m).reduce((a, b) => a + b.amount, 0) }));
  const byClass = classes.map((c) => {
    const rs = rows.filter((r) => r.student.classId === c.id);
    return { label: className(c.id), value: rs.reduce((a, r) => a + r.summary.paid, 0), exp: rs.reduce((a, r) => a + r.summary.net, 0) };
  }).filter((x) => x.exp > 0);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Expected (session)" value={inr(expected)} icon={<IndianRupee className="h-5 w-5" />} hint={`${rows.length} fee accounts`} />
        <StatCard label="Collected" value={inr(collected)} icon={<Wallet className="h-5 w-5" />} tone="green" hint={`${percent(collected, expected)}% of expected`} />
        <StatCard label="Outstanding" value={inr(outstanding)} icon={<TrendingUp className="h-5 w-5" />} tone="gold" />
        <StatCard label="Overdue accounts" value={defaulters.length} icon={<AlertTriangle className="h-5 w-5" />} tone="red" hint="Instalment past due date" />
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="Collection by month" subtitle="Session 2026-27 · successful payments" className="lg:col-span-3">
          <ColumnChart data={monthly} format={inr} />
        </Panel>
        <Panel title="Collection progress" className="lg:col-span-2">
          <p className="font-serif text-3xl font-semibold text-navy-900">{percent(collected, expected)}%</p>
          <p className="mb-3 text-xs text-navy-400">{inr(collected)} of {inr(expected)}</p>
          <ProgressBar value={percent(collected, expected)} tone="gold" />
          <div className="mt-6"><BarList rows={byClass.map((b) => ({ label: b.label, value: b.value, max: b.exp, sub: <span className="text-navy-300"> / {inr(b.exp)}</span> }))} format={inr} /></div>
        </Panel>
      </div>
      <Panel title="Overdue accounts" subtitle="Send reminders or collect at the counter" bodyClassName="p-0">
        {defaulters.length === 0 ? <EmptyState title="No overdue accounts" message="All instalments due so far have been paid." icon={<CheckCircle2 className="h-6 w-6" />} /> : (
          <ul className="divide-y divide-navy-50">
            {defaulters.slice(0, 8).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="flex items-center gap-3"><Avatar src={r.student.photo} name={r.student.name} size={32} /><div><p className="text-sm font-semibold">{r.student.name}</p><p className="text-xs text-navy-400">{className(r.student.classId)} – {r.student.section}</p></div></div>
                <div className="text-right"><p className="text-sm font-semibold text-red-600">{inr(r.summary.outstanding)}</p><p className="text-xs text-navy-400">{r.summary.installments.filter((i) => i.overdue).map((i) => i.label.split(' (')[0]).join(', ')}</p></div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

// ---------------- Structures ----------------
function Structures({ data }: { data: ReturnType<typeof useFeeData> }) {
  const { structures } = data;
  const { classes, name: className } = useClasses();
  const { isAdmin } = useStaff();
  const toast = useToast();
  const [editing, setEditing] = useState<FeeStructure | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<FeeStructure | null>(null);
  const [classId, setClassId] = useState('');
  const [year, setYear] = useState('2026-27');
  const [items, setItems] = useState<FeeItem[]>([]);
  const [inst, setInst] = useState<Installment[]>([]);
  const [lateFee, setLateFee] = useState('20');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const sorted = [...structures.items].sort((a, b) => (classes.find((c) => c.id === a.classId)?.order ?? 0) - (classes.find((c) => c.id === b.classId)?.order ?? 0));
  const free = classes.filter((c) => !structures.items.some((s) => s.classId === c.id));

  const openEdit = (s?: FeeStructure) => {
    setEditing(s ?? null); setErr('');
    setClassId(s?.classId ?? free[0]?.id ?? ''); setYear(s?.academicYear ?? '2026-27');
    setItems(s ? s.items.map((i) => ({ ...i })) : [{ category: 'Tuition Fee', amount: 20000 }, { category: 'Annual Charges', amount: 3500 }, { category: 'Examination Fee', amount: 1200 }]);
    setInst(s ? s.installments.map((i) => ({ ...i })) : (structures.items[0]?.installments ?? []).map((i) => ({ ...i })));
    setLateFee(String(s?.lateFeePerDay ?? 20));
    setOpen(true);
  };

  const save = async () => {
    if (!classId) return setErr('Select a class.');
    if (!items.length || items.some((i) => !i.category.trim() || !(i.amount > 0))) return setErr('Every fee head needs a name and an amount greater than zero.');
    if (!inst.length || inst.some((i) => !i.label.trim() || !i.dueDate)) return setErr('Every instalment needs a label and due date.');
    const total = inst.reduce((a, b) => a + Number(b.percent), 0);
    if (total !== 100) return setErr(`Instalment percentages must add up to 100% (currently ${total}%).`);
    setSaving(true);
    try {
      const body = { classId, academicYear: year, items: items.map((i) => ({ category: i.category.trim(), amount: Number(i.amount) })), installments: inst.map((i) => ({ ...i, percent: Number(i.percent) })), lateFeePerDay: Number(lateFee) || 0 };
      if (editing) await structures.update(editing.id, body); else await structures.create({ id: `fs-${classId}`, ...body });
      toast.success('Fee structure saved', `${className(classId)} · total ${inr(body.items.reduce((a, b) => a + b.amount, 0))}`);
      setOpen(false);
    } catch (e) { toast.error('Could not save', (e as Error).message); } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-navy-500">{structures.items.length} class fee structures · amounts shown are demo values</p>
        <Button icon={<Plus className="h-4 w-4" />} disabled={!free.length} onClick={() => openEdit()}>New structure</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((s) => {
          const total = s.items.reduce((a, b) => a + b.amount, 0);
          return (
            <div key={s.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between">
                <div><p className="font-serif text-lg font-semibold text-navy-900">{className(s.classId)}</p><p className="text-xs text-navy-400">Session {s.academicYear} · {s.installments.length} instalments</p></div>
                <div className="flex gap-1">
                  <button className="btn-ghost btn-sm" onClick={() => openEdit(s)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                  {isAdmin && <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setDeleting(s)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>}
                </div>
              </div>
              <ul className="mt-4 flex-1 space-y-1.5 text-sm">
                {s.items.map((i) => <li key={i.category} className="flex justify-between"><span className="text-navy-600">{i.category}</span><span className="font-medium">{inr(i.amount)}</span></li>)}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-navy-50 pt-3"><span className="text-xs text-navy-400">Late fee {inr(s.lateFeePerDay)}/day</span><span className="font-serif text-lg font-semibold">{inr(total)}</span></div>
            </div>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} size="lg" title={editing ? `Edit fee structure – ${className(editing.classId)}` : 'New fee structure'}
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button loading={saving} onClick={save}>Save structure</Button></>}>
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Class"><Select value={classId} disabled={!!editing} onChange={(e) => setClassId(e.target.value)} options={(editing ? classes : free).map((c) => ({ value: c.id, label: c.name }))} /></Field>
            <Field label="Session"><Input value={year} onChange={(e) => setYear(e.target.value)} /></Field>
            <Field label="Late fee / day (₹)"><Input type="number" min={0} value={lateFee} onChange={(e) => setLateFee(e.target.value)} /></Field>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between"><p className="label mb-0">Fee heads</p><button className="btn-ghost btn-sm" onClick={() => setItems([...items, { category: '', amount: 0 }])}><Plus className="h-3.5 w-3.5" />Add head</button></div>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder="Category" value={it.category} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, category: e.target.value } : x)))} />
                  <Input className="w-36" type="number" min={0} value={it.amount} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) } : x)))} aria-label="Amount" />
                  <button className="btn-ghost btn-sm text-red-600" onClick={() => setItems(items.filter((_, j) => j !== i))} aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-right text-sm font-semibold">Annual total: {inr(items.reduce((a, b) => a + (Number(b.amount) || 0), 0))}</p>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between"><p className="label mb-0">Instalments</p><button className="btn-ghost btn-sm" onClick={() => setInst([...inst, { label: `Instalment ${inst.length + 1}`, dueDate: todayISO(), percent: 0 }])}><Plus className="h-3.5 w-3.5" />Add instalment</button></div>
            <div className="space-y-2">
              {inst.map((it, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-2">
                  <Input value={it.label} onChange={(e) => setInst(inst.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} aria-label="Label" />
                  <Input className="w-40" type="date" value={it.dueDate} onChange={(e) => setInst(inst.map((x, j) => (j === i ? { ...x, dueDate: e.target.value } : x)))} aria-label="Due date" />
                  <Input className="w-20" type="number" min={0} max={100} value={it.percent} onChange={(e) => setInst(inst.map((x, j) => (j === i ? { ...x, percent: Number(e.target.value) } : x)))} aria-label="Percent" />
                  <button className="btn-ghost btn-sm text-red-600" onClick={() => setInst(inst.filter((_, j) => j !== i))} aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
          {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        </div>
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} title="Delete fee structure?" message={`Students of ${className(deleting?.classId)} will have no fee structure until a new one is created.`}
        onConfirm={async () => { if (deleting) { await structures.remove(deleting.id); toast.success('Fee structure deleted'); setDeleting(null); } }} />
    </div>
  );
}

// ---------------- Student fees ----------------
function StudentFees({ data }: { data: ReturnType<typeof useFeeData> }) {
  const { rows, loading, studentFees } = data;
  const { classOptions, name: className } = useClasses();
  const toast = useToast();
  const [fClass, setFClass] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [editing, setEditing] = useState<Row | null>(null);
  const form = useForm({ discount: '0', discountReason: '', transportFee: '0', lateFee: '0' }, {
    discount: [v.required(), v.min(0), v.max(100)], transportFee: [v.min(0)], lateFee: [v.min(0)],
  });
  const open = (r: Row) => { setEditing(r); form.reset({ discount: String(r.sf?.discount ?? 0), discountReason: r.sf?.discountReason ?? '', transportFee: String(r.sf?.transportFee ?? 0), lateFee: String(r.sf?.lateFee ?? 0) }); };
  const save = form.handleSubmit(async (vals) => {
    if (!editing) return;
    const patch = { discount: Number(vals.discount), discountReason: vals.discountReason || undefined, transportFee: Number(vals.transportFee) || 0, lateFee: Number(vals.lateFee) || 0 };
    if (editing.sf) await studentFees.update(editing.sf.id, patch);
    else await studentFees.create({ studentId: editing.student.id, structureId: `fs-${editing.student.classId}`, academicYear: '2026-27', ...patch });
    toast.success('Fee account updated', editing.student.name);
    setEditing(null);
  });
  const shown = rows.filter((r) => (!fClass || r.student.classId === fClass) && (!fStatus || r.status === fStatus));
  const columns: Column<Row>[] = [
    { key: 'student', header: 'Student', value: (r) => `${r.student.name} ${r.student.admissionNo}`, render: (r) => <div className="flex items-center gap-2"><Avatar src={r.student.photo} name={r.student.name} size={30} /><div><p className="font-medium">{r.student.name}</p><p className="text-xs text-navy-400">{className(r.student.classId)} – {r.student.section}</p></div></div> },
    { key: 'net', header: 'Net payable', value: (r) => r.summary.net, render: (r) => <div><p>{inr(r.summary.net)}</p>{r.summary.discountPct > 0 && <p className="text-xs text-emerald-600">−{r.summary.discountPct}% {r.sf?.discountReason ?? ''}</p>}</div> },
    { key: 'paid', header: 'Paid', value: (r) => r.summary.paid, render: (r) => inr(r.summary.paid) },
    { key: 'out', header: 'Outstanding', value: (r) => r.summary.outstanding, render: (r) => <span className={r.summary.outstanding ? 'font-semibold text-navy-900' : 'text-navy-400'}>{inr(r.summary.outstanding)}</span> },
    { key: 'next', header: 'Next due', value: (r) => r.summary.nextDue?.dueDate ?? '', render: (r) => r.summary.nextDue ? fmtDate(r.summary.nextDue.dueDate) : '—' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];
  return (
    <>
      <DataTable rows={shown} columns={columns} loading={loading} searchPlaceholder="Search student…"
        toolbar={<>
          <Select className="w-36" value={fClass} onChange={(e) => setFClass(e.target.value)} placeholder="All classes" options={classOptions} aria-label="Class" />
          <Select className="w-36" value={fStatus} onChange={(e) => setFStatus(e.target.value)} placeholder="Any status" options={['Paid', 'Partial', 'Overdue', 'Pending'].map((s) => ({ value: s, label: s }))} aria-label="Status" />
        </>}
        actions={(r) => <Button size="sm" variant="outline" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => open(r)}>Adjust</Button>} />
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Discounts & late fees" subtitle={editing?.student.name}
        footer={<><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button loading={form.submitting} onClick={() => save()}>Save</Button></>}>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="Discount (%)" error={form.errors.discount}><Input type="number" min={0} max={100} {...form.bind('discount')} /></Field>
          <Field label="Discount reason"><Select {...form.bind('discountReason')} placeholder="None" options={['Sibling concession', 'Merit scholarship', 'Staff ward', 'Financial assistance', 'Sports quota'].map((s) => ({ value: s, label: s }))} /></Field>
          <Field label="Transport fee (₹ / year)" error={form.errors.transportFee}><Input type="number" min={0} {...form.bind('transportFee')} /></Field>
          <Field label="Additional late fee (₹)" hint="Manual override, added to automatic late fee" error={form.errors.lateFee}><Input type="number" min={0} {...form.bind('lateFee')} /></Field>
          {editing && <div className="rounded-xl bg-mist p-3 text-sm sm:col-span-2">Gross annual fee {inr(editing.summary.gross)} · automatic late fee so far {inr(editing.summary.installments.reduce((a, b) => a + b.lateFee, 0))}</div>}
          <button type="submit" hidden />
        </form>
      </Modal>
    </>
  );
}

// ---------------- Collect fee ----------------
function CollectFee({ data }: { data: ReturnType<typeof useFeeData> }) {
  const { rows, payments } = data;
  const { name: className } = useClasses();
  const { user } = useAuth();
  const toast = useToast();
  const [sid, setSid] = useState('');
  const [inst, setInst] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [ref, setRef] = useState('');
  const [remarks, setRemarks] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<Payment | null>(null);
  const row = rows.find((r) => r.id === sid);
  const pending = row?.summary.installments.filter((i) => !i.paid) ?? [];

  const pickStudent = (id: string) => {
    setSid(id); setDone(null); setErr('');
    const r = rows.find((x) => x.id === id);
    const first = r?.summary.installments.find((i) => !i.paid);
    setInst(first?.label ?? ''); setAmount(first ? String(first.amount + first.lateFee) : '');
  };
  const pickInst = (label: string) => { setInst(label); const i = pending.find((x) => x.label === label); if (i) setAmount(String(i.amount + i.lateFee)); };

  const record = async () => {
    setErr('');
    if (!row) return setErr('Select a student.');
    if (!inst) return setErr('Select the instalment being paid.');
    const amt = Number(amount);
    if (!(amt > 0)) return setErr('Enter a valid amount.');
    if (method !== 'Cash' && !ref.trim()) return setErr(`Enter the ${method === 'Cheque' ? 'cheque number' : 'transaction reference'}.`);
    setSaving(true);
    try {
      const p = await payments.create({
        studentId: row.id, amount: amt, installment: inst, method, date: todayISO(), status: 'Success',
        receiptNo: nextReceiptNo(payments.items), txnId: method === 'Cash' ? `CASH-${Date.now().toString(36).toUpperCase()}` : ref.trim(), collectedBy: user?.name,
      });
      setDone(p); setRef(''); setRemarks('');
      toast.success('Payment recorded', `${inr(amt)} received from ${row.student.name}. Receipt ${p.receiptNo}`);
    } catch (e) { toast.error('Could not record payment', (e as Error).message); } finally { setSaving(false); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Panel title="Counter collection" subtitle="Record Cash / Cheque / UPI payments received at the office" className="lg:col-span-3">
        <div className="space-y-4">
          <Field label="Student"><SearchSelect value={sid} onChange={pickStudent} placeholder="Search by name or admission no." options={rows.map((r) => ({ value: r.id, label: r.student.name, sub: `${className(r.student.classId)}-${r.student.section} · ${r.student.admissionNo}` }))} /></Field>
          {row && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Instalment"><Select value={inst} onChange={(e) => pickInst(e.target.value)} placeholder={pending.length ? 'Select' : 'All instalments paid'} options={pending.map((i) => ({ value: i.label, label: `${i.label} – ${inr(i.amount + i.lateFee)}` }))} /></Field>
                <Field label="Amount (₹)"><Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
                <Field label="Payment mode"><Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} options={(['Cash', 'Cheque', 'UPI', 'Card'] as PaymentMethod[]).map((m) => ({ value: m, label: m }))} /></Field>
                {method !== 'Cash' && <Field label={method === 'Cheque' ? 'Cheque no.' : 'Transaction ref.'}><Input value={ref} onChange={(e) => setRef(e.target.value)} /></Field>}
                <Field label="Remarks" className="sm:col-span-2"><Textarea rows={2} className="min-h-[60px]" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" /></Field>
              </div>
              {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
              <div className="flex flex-wrap justify-end gap-2">
                {done && <Button variant="outline" icon={<Receipt className="h-4 w-4" />} onClick={() => downloadReceipt(done, row.student, className(row.student.classId))}>Download receipt</Button>}
                <Button icon={<Wallet className="h-4 w-4" />} loading={saving} disabled={!pending.length} onClick={record}>Record payment</Button>
              </div>
            </>
          )}
          {!row && err && <p className="text-sm text-red-600">{err}</p>}
        </div>
      </Panel>
      <Panel title="Fee summary" className="lg:col-span-2">
        {!row ? <EmptyState title="Select a student" message="Dues, instalments and payment history will appear here." icon={<Wallet className="h-6 w-6" />} /> : (
          <div className="space-y-4">
            <div className="flex items-center gap-3"><Avatar src={row.student.photo} name={row.student.name} size={44} /><div><p className="font-semibold">{row.student.name}</p><p className="text-xs text-navy-400">{className(row.student.classId)} – {row.student.section} · {row.student.admissionNo}</p></div></div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-mist p-2"><p className="text-[10px] uppercase text-navy-400">Net</p><p className="text-sm font-semibold">{inr(row.summary.net)}</p></div>
              <div className="rounded-xl bg-emerald-50 p-2"><p className="text-[10px] uppercase text-emerald-700">Paid</p><p className="text-sm font-semibold text-emerald-700">{inr(row.summary.paid)}</p></div>
              <div className="rounded-xl bg-gold-50 p-2"><p className="text-[10px] uppercase text-gold-700">Due</p><p className="text-sm font-semibold text-gold-800">{inr(row.summary.outstanding)}</p></div>
            </div>
            <ul className="space-y-2">
              {row.summary.installments.map((i) => (
                <li key={i.label} className="flex items-center justify-between rounded-lg border border-navy-50 px-3 py-2 text-sm">
                  <div><p className="font-medium">{i.label}</p><p className="text-xs text-navy-400">Due {fmtDate(i.dueDate)}{i.lateFee ? ` · late fee ${inr(i.lateFee)}` : ''}</p></div>
                  <div className="text-right"><p>{inr(i.amount)}</p><StatusBadge status={i.paid ? 'Paid' : i.overdue ? 'Overdue' : 'Due'} /></div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>
    </div>
  );
}

// ---------------- Reports ----------------
function Reports({ data }: { data: ReturnType<typeof useFeeData> }) {
  const { classes, name: className } = useClasses();
  const toast = useToast();
  type R = { id: string; cls: string; students: number; expected: number; collected: number; outstanding: number; pct: number; overdue: number };
  const rows: R[] = classes.map((c) => {
    const rs = data.rows.filter((r) => r.student.classId === c.id);
    const expected = rs.reduce((a, r) => a + r.summary.net, 0), collected = rs.reduce((a, r) => a + r.summary.paid, 0);
    return { id: c.id, cls: className(c.id), students: rs.length, expected, collected, outstanding: rs.reduce((a, r) => a + r.summary.outstanding, 0), pct: percent(collected, expected), overdue: rs.filter((r) => r.status === 'Overdue').length };
  }).filter((r) => r.students > 0);
  const cols: Column<R>[] = [
    { key: 'cls', header: 'Class' }, { key: 'students', header: 'Students' },
    { key: 'expected', header: 'Expected', render: (r) => inr(r.expected) }, { key: 'collected', header: 'Collected', render: (r) => inr(r.collected) },
    { key: 'outstanding', header: 'Outstanding', render: (r) => inr(r.outstanding) },
    { key: 'pct', header: 'Collection', render: (r) => <div className="flex min-w-[120px] items-center gap-2"><ProgressBar value={r.pct} tone="gold" /><span className="text-xs">{r.pct}%</span></div> },
    { key: 'overdue', header: 'Overdue', render: (r) => r.overdue ? <Badge tone="red">{r.overdue}</Badge> : <span className="text-navy-300">0</span> },
  ];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" icon={<Download className="h-4 w-4" />} onClick={() => { downloadText('fee-collection-report.csv', toCSV(rows, [{ key: 'cls', label: 'Class' }, { key: 'students', label: 'Students' }, { key: 'expected', label: 'Expected' }, { key: 'collected', label: 'Collected' }, { key: 'outstanding', label: 'Outstanding' }, { key: 'pct', label: 'Collection %' }, { key: 'overdue', label: 'Overdue accounts' }]), 'text/csv'); toast.success('CSV downloaded'); }}>Export CSV</Button>
        <Button icon={<FileText className="h-4 w-4" />} onClick={() => { downloadReportPdf('Class-wise Fee Collection – Session 2026-27', ['Class', 'Students', 'Expected', 'Collected', 'Outstanding', '%', 'Overdue'], rows.map((r) => [r.cls, r.students, `Rs. ${r.expected}`, `Rs. ${r.collected}`, `Rs. ${r.outstanding}`, `${r.pct}%`, r.overdue]), 'fee-collection-report.pdf'); toast.success('PDF report downloaded'); }}>Export PDF</Button>
      </div>
      <DataTable rows={rows} columns={cols} loading={data.loading} searchable={false} pageSize={20} />
    </div>
  );
}

// ---------------- Payments log ----------------
function PaymentsLog({ data }: { data: ReturnType<typeof useFeeData> }) {
  const { payments, students } = data;
  const { name: className } = useClasses();
  const [st, setSt] = useState('');
  const [m, setM] = useState('');
  const stu = (id: string) => students.items.find((s) => s.id === id);
  const rows = payments.items.filter((p) => (!st || p.status === st) && (!m || p.method === m)).sort((a, b) => b.date.localeCompare(a.date));
  const cols: Column<Payment>[] = [
    { key: 'receiptNo', header: 'Receipt' },
    { key: 'date', header: 'Date', render: (p) => fmtDate(p.date) },
    { key: 'student', header: 'Student', value: (p) => stu(p.studentId)?.name ?? '', render: (p) => { const s = stu(p.studentId); return s ? <div><p className="font-medium">{s.name}</p><p className="text-xs text-navy-400">{className(s.classId)} – {s.section}</p></div> : '—'; } },
    { key: 'installment', header: 'Instalment', render: (p) => p.installment.split(' (')[0] },
    { key: 'method', header: 'Mode' },
    { key: 'amount', header: 'Amount', render: (p) => <span className="font-semibold">{inr(p.amount)}</span> },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
  ];
  return (
    <DataTable rows={rows} columns={cols} loading={payments.loading} searchPlaceholder="Search receipt, student, txn…"
      toolbar={<>
        <Select className="w-32" value={st} onChange={(e) => setSt(e.target.value)} placeholder="Any status" options={['Success', 'Failed'].map((x) => ({ value: x, label: x }))} aria-label="Status" />
        <Select className="w-36" value={m} onChange={(e) => setM(e.target.value)} placeholder="Any mode" options={['UPI', 'Card', 'Net Banking', 'Cash', 'Cheque'].map((x) => ({ value: x, label: x }))} aria-label="Mode" />
      </>}
      actions={(p) => p.status === 'Success' && stu(p.studentId) ? <button className="btn-ghost btn-sm" onClick={() => { const s = stu(p.studentId)!; downloadReceipt(p, s, className(s.classId)); }}><Receipt className="h-4 w-4" />Receipt</button> : <span className="text-xs text-navy-300">—</span>} />
  );
}

type Tab = 'overview' | 'structures' | 'students' | 'collect' | 'reports' | 'payments';
export default function FeeManagement() {
  const data = useFeeData();
  const [tab, setTab] = useState<Tab>('overview');
  return (
    <div>
      <PageHeader eyebrow="Fee Management" title="Fees & Collections" subtitle="Session 2026-27 · fee structures, concessions, collections and reports"
        actions={<Button variant="gold" icon={<Wallet className="h-4 w-4" />} onClick={() => setTab('collect')}>Collect fee</Button>} />
      <Tabs className="mb-5 w-fit max-w-full" value={tab} onChange={setTab} tabs={[
        { value: 'overview', label: 'Overview' }, { value: 'structures', label: 'Fee Structures' }, { value: 'students', label: 'Student Fees' },
        { value: 'collect', label: 'Collect Fee' }, { value: 'reports', label: 'Reports' }, { value: 'payments', label: 'Payments' },
      ]} />
      {tab === 'overview' && <Overview data={data} />}
      {tab === 'structures' && <Structures data={data} />}
      {tab === 'students' && <StudentFees data={data} />}
      {tab === 'collect' && <CollectFee data={data} />}
      {tab === 'reports' && <Reports data={data} />}
      {tab === 'payments' && <PaymentsLog data={data} />}
    </div>
  );
}
