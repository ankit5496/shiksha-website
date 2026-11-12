import { useMemo, useState } from 'react';
import { Eye, Mail, Pencil, Phone, Plus, Trash2, X } from 'lucide-react';
import type { Teacher } from '@/types';
import { useCollection } from '@/hooks/useCollection';
import { useForm, v } from '@/hooks/useForm';
import { useToast } from '@/context/ToastContext';
import { Avatar, Badge, Button, ConfirmDialog, DataTable, Field, Input, Modal, PageHeader, Select, StatCard, StatusBadge, type Column } from '@/components/ui';
import { avatar } from '@/data/images';
import { fmtDate } from '@/utils/format';
import { ChipPicker, useClasses, useStaff } from './_shared';
import { UserCheck, UserMinus, Users } from 'lucide-react';

type FormVals = {
  name: string; empId: string; email: string; phone: string; designation: string; qualification: string;
  joinDate: string; status: string; subjects: string[]; classes: string[];
};
const empty: FormVals = { name: '', empId: '', email: '', phone: '', designation: '', qualification: '', joinDate: new Date().toISOString().slice(0, 10), status: 'Active', subjects: [], classes: [] };

export default function Teachers() {
  const { items: teachers, loading, create, update, remove } = useCollection('teachers');
  const { items: subjects } = useCollection('subjects');
  const { classSections, name: className } = useClasses();
  const { isAdmin } = useStaff();
  const toast = useToast();

  const [fStatus, setFStatus] = useState('');
  const [fSubject, setFSubject] = useState('');
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<Teacher | null>(null);
  const [deleting, setDeleting] = useState<Teacher | null>(null);
  const [busy, setBusy] = useState(false);

  const subjectNames = useMemo(() => [...new Set([...subjects.map((s) => s.name), 'Physical Education'])].sort(), [subjects]);
  const form = useForm<FormVals>(empty, {
    name: [v.required(), v.minLength(3)], empId: [v.required()], email: [v.required(), v.email()], phone: [v.required(), v.phone()],
    designation: [v.required()], qualification: [v.required()], joinDate: [v.required()],
    subjects: [v.required('Assign at least one subject')],
  });

  const csLabel = (cs: string) => { const [c, s] = cs.split('-'); return `${className(c)}-${s}`; };

  const openAdd = () => {
    setEditing(null);
    const next = Math.max(0, ...teachers.map((t) => Number(t.empId.split('-').pop()) || 0)) + 1;
    form.reset({ ...empty, empId: `SPS-T-${String(next).padStart(3, '0')}` });
    setOpen(true);
  };
  const openEdit = (t: Teacher) => {
    setEditing(t);
    form.reset({ name: t.name, empId: t.empId, email: t.email, phone: t.phone, designation: t.designation, qualification: t.qualification, joinDate: t.joinDate, status: t.status, subjects: [...t.subjects], classes: [...t.classes] });
    setOpen(true);
  };

  const save = form.handleSubmit(async (vals) => {
    const data = { ...vals, name: vals.name.trim(), status: vals.status as Teacher['status'], photo: editing?.photo ?? avatar(vals.name, 'E8EDF5', '172E56') };
    try {
      if (editing) { await update(editing.id, data); toast.success('Teacher updated', `${data.name}'s profile was saved.`); }
      else { await create(data); toast.success('Teacher added', `${data.name} has joined the staff directory.`); }
      setOpen(false);
    } catch (e) { toast.error('Could not save', (e as Error).message); }
  });

  const rows = teachers.filter((t) => (!fStatus || t.status === fStatus) && (!fSubject || t.subjects.includes(fSubject)));
  const columns: Column<Teacher>[] = [
    { key: 'name', header: 'Teacher', value: (t) => `${t.name} ${t.empId}`, render: (t) => (
      <div className="flex items-center gap-3"><Avatar src={t.photo} name={t.name} size={36} /><div><p className="font-semibold text-navy-900">{t.name}</p><p className="text-xs text-navy-400">{t.empId}</p></div></div>
    ) },
    { key: 'designation', header: 'Designation' },
    { key: 'subjects', header: 'Subjects', value: (t) => t.subjects.join(', '), render: (t) => <div className="flex flex-wrap gap-1">{t.subjects.map((s) => <Badge key={s} tone="gold">{s}</Badge>)}</div> },
    { key: 'classes', header: 'Classes', value: (t) => t.classes.join(', '), render: (t) => <span className="text-xs text-navy-600">{t.classes.slice(0, 3).map(csLabel).join(', ')}{t.classes.length > 3 && ` +${t.classes.length - 3}`}</span> },
    { key: 'phone', header: 'Phone' },
    { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
  ];

  return (
    <div>
      <PageHeader eyebrow="Teacher Management" title="Teachers" subtitle="Staff directory, subject allocation and class assignments"
        actions={isAdmin && <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Add teacher</Button>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Teaching staff" value={teachers.length} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Active" value={teachers.filter((t) => t.status === 'Active').length} icon={<UserCheck className="h-5 w-5" />} tone="green" />
        <StatCard label="On leave" value={teachers.filter((t) => t.status === 'On Leave').length} icon={<UserMinus className="h-5 w-5" />} tone="gold" />
      </div>
      <DataTable rows={rows} columns={columns} loading={loading} onRowClick={setViewing} searchPlaceholder="Search teachers…"
        toolbar={<>
          <Select className="w-44" value={fSubject} onChange={(e) => setFSubject(e.target.value)} placeholder="All subjects" options={subjectNames.map((s) => ({ value: s, label: s }))} aria-label="Filter subject" />
          <Select className="w-36" value={fStatus} onChange={(e) => setFStatus(e.target.value)} placeholder="Any status" options={['Active', 'On Leave', 'Inactive'].map((s) => ({ value: s, label: s }))} aria-label="Filter status" />
        </>}
        actions={(t) => <>
          <button className="btn-ghost btn-sm" onClick={() => setViewing(t)} aria-label="View"><Eye className="h-4 w-4" /></button>
          {isAdmin && <button className="btn-ghost btn-sm" onClick={() => openEdit(t)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>}
          {isAdmin && <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setDeleting(t)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>}
        </>} />

      <Modal open={open} onClose={() => setOpen(false)} size="xl" title={editing ? `Edit ${editing.name}` : 'Add teacher'}
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button loading={form.submitting} onClick={() => save()}>{editing ? 'Save changes' : 'Add teacher'}</Button></>}>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Full name" required error={form.errors.name} className="lg:col-span-2"><Input {...form.bind('name')} /></Field>
          <Field label="Employee ID" required error={form.errors.empId}><Input {...form.bind('empId')} /></Field>
          <Field label="Email" required error={form.errors.email}><Input type="email" {...form.bind('email')} /></Field>
          <Field label="Mobile" required error={form.errors.phone}><Input {...form.bind('phone')} /></Field>
          <Field label="Joining date" required error={form.errors.joinDate}><Input type="date" {...form.bind('joinDate')} /></Field>
          <Field label="Designation" required error={form.errors.designation}><Input {...form.bind('designation')} placeholder="e.g. TGT – Science" /></Field>
          <Field label="Qualification" required error={form.errors.qualification}><Input {...form.bind('qualification')} placeholder="e.g. M.Sc., B.Ed." /></Field>
          <Field label="Status"><Select {...form.bind('status')} options={['Active', 'On Leave', 'Inactive'].map((s) => ({ value: s, label: s }))} /></Field>
          <Field label="Subjects" required error={form.errors.subjects} className="sm:col-span-2 lg:col-span-3">
            <ChipPicker options={subjectNames.map((s) => ({ value: s, label: s }))} value={form.values.subjects} onChange={(val) => form.set('subjects', val)} />
          </Field>
          <Field label="Assigned classes" hint="Click to toggle class-sections" className="sm:col-span-2 lg:col-span-3">
            <ChipPicker options={classSections} value={form.values.classes} onChange={(val) => form.set('classes', val)} />
          </Field>
          <button type="submit" hidden />
        </form>
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewing(null)} size="lg" title="Teacher profile"
        footer={viewing && isAdmin ? <Button icon={<Pencil className="h-4 w-4" />} onClick={() => { const t = viewing; setViewing(null); openEdit(t); }}>Edit profile</Button> : undefined}>
        {viewing && (
          <div>
            <div className="flex items-center gap-4">
              <Avatar src={viewing.photo} name={viewing.name} size={72} />
              <div>
                <p className="font-serif text-xl font-semibold text-navy-900">{viewing.name}</p>
                <p className="text-sm text-navy-500">{viewing.designation} · {viewing.empId}</p>
                <div className="mt-1"><StatusBadge status={viewing.status} /></div>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a href={`mailto:${viewing.email}`} className="flex items-center gap-2 rounded-xl bg-mist p-3 text-sm hover:bg-navy-50"><Mail className="h-4 w-4 text-navy-400" />{viewing.email}</a>
              <a href={`tel:${viewing.phone}`} className="flex items-center gap-2 rounded-xl bg-mist p-3 text-sm hover:bg-navy-50"><Phone className="h-4 w-4 text-navy-400" />{viewing.phone}</a>
            </div>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div><dt className="label">Qualification</dt><dd className="text-sm">{viewing.qualification}</dd></div>
              <div><dt className="label">Joined</dt><dd className="text-sm">{fmtDate(viewing.joinDate)}</dd></div>
              <div className="sm:col-span-2"><dt className="label">Subjects</dt><dd className="flex flex-wrap gap-1">{viewing.subjects.map((s) => <Badge key={s} tone="gold">{s}</Badge>)}</dd></div>
              <div className="sm:col-span-2"><dt className="label">Classes</dt><dd className="flex flex-wrap gap-1">{viewing.classes.length ? viewing.classes.map((c) => <Badge key={c}>{csLabel(c)}</Badge>) : <span className="flex items-center gap-1 text-sm text-navy-400"><X className="h-3 w-3" />No classes assigned</span>}</dd></div>
            </dl>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} loading={busy} title="Remove teacher?"
        message={`${deleting?.name ?? ''} will be removed from the staff directory.`}
        onConfirm={async () => { if (!deleting) return; setBusy(true); try { await remove(deleting.id); toast.success('Teacher removed'); setDeleting(null); } finally { setBusy(false); } }} />
    </div>
  );
}
