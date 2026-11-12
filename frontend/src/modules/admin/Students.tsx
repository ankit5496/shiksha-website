import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, Eye, Pencil, Plus, Trash2, Bus as BusIcon, Phone, MapPin } from 'lucide-react';
import type { Student } from '@/types';
import { useCollection } from '@/hooks/useCollection';
import { useForm, v } from '@/hooks/useForm';
import { useToast } from '@/context/ToastContext';
import {
  Avatar, Badge, Button, ConfirmDialog, DataTable, Field, Input, Modal, PageHeader, SearchSelect, Select, StatusBadge, Textarea, type Column,
} from '@/components/ui';
import { avatar } from '@/data/images';
import { downloadText, fmtDate, toCSV } from '@/utils/format';
import { BLOOD_GROUPS, useClasses } from './_shared';

type FormVals = {
  name: string; gender: string; dob: string; classId: string; section: string; rollNo: string; admissionNo: string;
  fatherName: string; motherName: string; phone: string; email: string; address: string; bloodGroup: string;
  busRouteId: string; stopId: string; status: string; admissionDate: string;
};

const empty: FormVals = {
  name: '', gender: '', dob: '', classId: '', section: 'A', rollNo: '', admissionNo: '', fatherName: '', motherName: '',
  phone: '', email: '', address: '', bloodGroup: '', busRouteId: '', stopId: '', status: 'Active', admissionDate: new Date().toISOString().slice(0, 10),
};

export default function Students() {
  const { items: students, loading, create, update, remove } = useCollection('students');
  const { items: routes } = useCollection('routes');
  const studentFees = useCollection('studentFees');
  const { classOptions, name: className, sectionsOf, classes } = useClasses();
  const toast = useToast();
  const loc = useLocation();
  const navigate = useNavigate();

  const [fClass, setFClass] = useState('');
  const [fSection, setFSection] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [editing, setEditing] = useState<Student | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState<Student | null>(null);
  const [busy, setBusy] = useState(false);

  const form = useForm<FormVals>(empty, {
    name: [v.required(), v.minLength(3)],
    gender: [v.required()],
    dob: [v.required()],
    classId: [v.required('Select a class')],
    section: [v.required()],
    rollNo: [v.required(), v.min(1)],
    admissionNo: [v.required()],
    fatherName: [v.required()],
    motherName: [v.required()],
    phone: [v.required(), v.phone()],
    email: [v.email()],
    address: [v.required()],
    stopId: [(val, all) => (all.busRouteId && !val ? 'Select a pick-up stop' : undefined)],
  });

  const suggestAdmNo = () => {
    const year = new Date().getFullYear();
    const max = Math.max(0, ...students.map((s) => Number(s.admissionNo.split('/').pop()) || 0));
    return `SPS/${year}/${String(max + 1).padStart(4, '0')}`;
  };

  const openAdd = (prefill?: Partial<FormVals>) => {
    setEditing(null);
    form.reset({ ...empty, admissionNo: suggestAdmNo(), ...prefill });
    setFormOpen(true);
  };
  const openEdit = (s: Student) => {
    setEditing(s);
    form.reset({
      name: s.name, gender: s.gender, dob: s.dob, classId: s.classId, section: s.section, rollNo: String(s.rollNo), admissionNo: s.admissionNo,
      fatherName: s.fatherName, motherName: s.motherName, phone: s.phone, email: s.email ?? '', address: s.address, bloodGroup: s.bloodGroup ?? '',
      busRouteId: s.busRouteId ?? '', stopId: s.stopId ?? '', status: s.status, admissionDate: s.admissionDate,
    });
    setFormOpen(true);
  };

  // Enquiry → "convert to admission" hands over a prefill through router state
  useEffect(() => {
    const st = loc.state as { prefill?: Partial<FormVals> } | null;
    if (st?.prefill && !loading) {
      openAdd(st.prefill);
      navigate(loc.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.state, loading]);

  // auto-suggest the next roll number when class/section changes for a new student
  useEffect(() => {
    if (!formOpen || editing || !form.values.classId) return;
    const n = students.filter((s) => s.classId === form.values.classId && s.section === form.values.section).length + 1;
    form.set('rollNo', String(n));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.classId, form.values.section, formOpen]);

  const save = form.handleSubmit(async (vals) => {
    const data: Omit<Student, 'id'> = {
      name: vals.name.trim(), gender: vals.gender as Student['gender'], dob: vals.dob, classId: vals.classId, section: vals.section,
      rollNo: Number(vals.rollNo), admissionNo: vals.admissionNo.trim(), fatherName: vals.fatherName.trim(), motherName: vals.motherName.trim(),
      phone: vals.phone.trim(), email: vals.email.trim() || undefined, address: vals.address.trim(), bloodGroup: vals.bloodGroup || undefined,
      busRouteId: vals.busRouteId || undefined, stopId: vals.busRouteId ? vals.stopId : undefined, status: vals.status as Student['status'],
      admissionDate: vals.admissionDate,
      photo: editing?.photo ?? avatar(vals.name, vals.gender === 'Female' ? 'F5EBCD' : 'D9E1EE', vals.gender === 'Female' ? '6D4B23' : '172E56'),
    };
    try {
      if (editing) {
        await update(editing.id, data);
        const sf = studentFees.items.find((x) => x.studentId === editing.id);
        if (sf) await studentFees.update(sf.id, { structureId: `fs-${data.classId}`, transportFee: data.busRouteId ? (sf.transportFee || 9600) : 0 });
        toast.success('Student updated', `${data.name}'s record has been saved.`);
      } else {
        const s = await create(data);
        await studentFees.create({ studentId: s.id, structureId: `fs-${s.classId}`, academicYear: '2026-27', discount: 0, lateFee: 0, transportFee: s.busRouteId ? 9600 : 0 });
        toast.success('Student admitted', `${s.name} added to ${className(s.classId)} – ${s.section}. Fee account created.`);
      }
      setFormOpen(false);
    } catch (e) {
      toast.error('Could not save', (e as Error).message);
    }
  });

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await remove(deleting.id);
      const sf = studentFees.items.find((x) => x.studentId === deleting.id);
      if (sf) await studentFees.remove(sf.id);
      toast.success('Student removed', `${deleting.name} was deleted.`);
      setDeleting(null);
    } catch (e) { toast.error('Delete failed', (e as Error).message); } finally { setBusy(false); }
  };

  const rows = useMemo(() => students
    .filter((s) => (!fClass || s.classId === fClass) && (!fSection || s.section === fSection) && (!fStatus || s.status === fStatus))
    .sort((a, b) => (classes.find((c) => c.id === a.classId)?.order ?? 0) - (classes.find((c) => c.id === b.classId)?.order ?? 0) || a.section.localeCompare(b.section) || a.rollNo - b.rollNo),
  [students, fClass, fSection, fStatus, classes]);

  const routeName = (id?: string) => routes.find((r) => r.id === id)?.name;
  const stopName = (rid?: string, sid?: string) => routes.find((r) => r.id === rid)?.stops.find((s) => s.id === sid)?.name;

  const columns: Column<Student>[] = [
    { key: 'name', header: 'Student', render: (s) => (
      <div className="flex items-center gap-3"><Avatar src={s.photo} name={s.name} size={36} />
        <div><p className="font-semibold text-navy-900">{s.name}</p><p className="text-xs text-navy-400">{s.admissionNo}</p></div></div>
    ), value: (s) => `${s.name} ${s.admissionNo}` },
    { key: 'class', header: 'Class', value: (s) => `${className(s.classId)} ${s.section}`, render: (s) => <span>{className(s.classId)} – {s.section}</span> },
    { key: 'rollNo', header: 'Roll', value: (s) => s.rollNo },
    { key: 'fatherName', header: "Father's name" },
    { key: 'phone', header: 'Phone' },
    { key: 'bus', header: 'Transport', value: (s) => routeName(s.busRouteId) ?? '', render: (s) => s.busRouteId ? <Badge tone="blue">{routes.find((r) => r.id === s.busRouteId)?.code}</Badge> : <span className="text-navy-300">—</span> },
    { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
  ];

  const exportCsv = () => {
    downloadText(`students-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows, [
      { key: 'admissionNo', label: 'Admission No' }, { key: 'name', label: 'Name' }, { key: 'class', label: 'Class', value: (s) => className(s.classId) },
      { key: 'section', label: 'Section' }, { key: 'rollNo', label: 'Roll No' }, { key: 'gender', label: 'Gender' }, { key: 'dob', label: 'DOB' },
      { key: 'fatherName', label: 'Father' }, { key: 'motherName', label: 'Mother' }, { key: 'phone', label: 'Phone' }, { key: 'address', label: 'Address' },
      { key: 'route', label: 'Bus Route', value: (s) => routeName(s.busRouteId) ?? '' }, { key: 'status', label: 'Status' },
    ]), 'text/csv');
    toast.success('Export ready', `${rows.length} student records downloaded as CSV.`);
  };

  const selRoute = routes.find((r) => r.id === form.values.busRouteId);

  return (
    <div>
      <PageHeader eyebrow="Student Management" title="Students" subtitle={`${students.length} students on roll · manage admissions, class allocation and records`}
        actions={<>
          <Button variant="outline" icon={<Download className="h-4 w-4" />} onClick={exportCsv}>Export CSV</Button>
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => openAdd()}>Add student</Button>
        </>} />

      <DataTable rows={rows} columns={columns} loading={loading} searchPlaceholder="Search name, admission no, phone…" onRowClick={setViewing}
        toolbar={<>
          <Select className="w-36" value={fClass} onChange={(e) => { setFClass(e.target.value); setFSection(''); }} options={classOptions} placeholder="All classes" aria-label="Filter class" />
          <Select className="w-32" value={fSection} onChange={(e) => setFSection(e.target.value)} options={(fClass ? sectionsOf(fClass) : ['A', 'B']).map((s) => ({ value: s, label: `Section ${s}` }))} placeholder="All sections" aria-label="Filter section" />
          <Select className="w-32" value={fStatus} onChange={(e) => setFStatus(e.target.value)} options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]} placeholder="Any status" aria-label="Filter status" />
        </>}
        actions={(s) => <>
          <button className="btn-ghost btn-sm" onClick={() => setViewing(s)} aria-label="View"><Eye className="h-4 w-4" /></button>
          <button className="btn-ghost btn-sm" onClick={() => openEdit(s)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
          <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setDeleting(s)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
        </>} />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} size="xl" title={editing ? `Edit ${editing.name}` : 'Add new student'} subtitle="Fields marked * are required"
        footer={<><Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button loading={form.submitting} onClick={() => save()}>{editing ? 'Save changes' : 'Add student'}</Button></>}>
        <form onSubmit={save} className="space-y-6">
          <div>
            <p className="mb-3 text-sm font-semibold text-navy-800">Student details</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Full name" required error={form.errors.name} className="lg:col-span-2"><Input {...form.bind('name')} placeholder="e.g. Aarav Sharma" /></Field>
              <Field label="Gender" required error={form.errors.gender}><Select {...form.bind('gender')} placeholder="Select" options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }]} /></Field>
              <Field label="Date of birth" required error={form.errors.dob}><Input type="date" {...form.bind('dob')} /></Field>
              <Field label="Blood group"><Select {...form.bind('bloodGroup')} placeholder="Select" options={BLOOD_GROUPS.map((b) => ({ value: b, label: b }))} /></Field>
              <Field label="Status"><Select {...form.bind('status')} options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]} /></Field>
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-navy-800">Admission & class</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Admission no." required error={form.errors.admissionNo} hint="Auto-suggested, editable"><Input {...form.bind('admissionNo')} /></Field>
              <Field label="Admission date"><Input type="date" {...form.bind('admissionDate')} /></Field>
              <Field label="Class" required error={form.errors.classId}>
                <SearchSelect value={form.values.classId} onChange={(val) => { form.set('classId', val); form.set('section', sectionsOf(val)[0]); }} options={classOptions} placeholder="Select class" invalid={!!form.errors.classId} />
              </Field>
              <Field label="Section" required error={form.errors.section}><Select {...form.bind('section')} options={sectionsOf(form.values.classId).map((s) => ({ value: s, label: `Section ${s}` }))} /></Field>
              <Field label="Roll no." required error={form.errors.rollNo}><Input type="number" min={1} {...form.bind('rollNo')} /></Field>
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-navy-800">Parent & contact</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Father's name" required error={form.errors.fatherName}><Input {...form.bind('fatherName')} /></Field>
              <Field label="Mother's name" required error={form.errors.motherName}><Input {...form.bind('motherName')} /></Field>
              <Field label="Mobile" required error={form.errors.phone}><Input {...form.bind('phone')} placeholder="+91 98xxxxxxxx" /></Field>
              <Field label="Email" error={form.errors.email}><Input type="email" {...form.bind('email')} placeholder="parent@example.com" /></Field>
              <Field label="Address" required error={form.errors.address} className="sm:col-span-2"><Textarea rows={2} className="min-h-[64px]" {...form.bind('address')} /></Field>
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-navy-800">Transport (optional)</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Bus route"><Select value={form.values.busRouteId} onChange={(e) => { form.set('busRouteId', e.target.value); form.set('stopId', ''); }} placeholder="No transport" options={routes.map((r) => ({ value: r.id, label: `${r.code} · ${r.name}` }))} /></Field>
              <Field label="Pick-up stop" error={form.errors.stopId}><Select {...form.bind('stopId')} disabled={!selRoute} placeholder={selRoute ? 'Select stop' : '—'} options={(selRoute?.stops.slice(0, -1) ?? []).map((s) => ({ value: s.id, label: `${s.name} (${s.time})` }))} /></Field>
            </div>
          </div>
          <button type="submit" hidden />
        </form>
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewing(null)} size="lg" title="Student profile"
        footer={viewing && <><Button variant="outline" onClick={() => setViewing(null)}>Close</Button><Button icon={<Pencil className="h-4 w-4" />} onClick={() => { const s = viewing; setViewing(null); openEdit(s); }}>Edit</Button></>}>
        {viewing && (
          <div>
            <div className="flex flex-col items-start gap-4 rounded-xl bg-navy-950 p-5 text-white sm:flex-row sm:items-center">
              <Avatar src={viewing.photo} name={viewing.name} size={72} />
              <div className="flex-1">
                <p className="font-serif text-xl font-semibold">{viewing.name}</p>
                <p className="text-sm text-navy-300">{className(viewing.classId)} – {viewing.section} · Roll {viewing.rollNo}</p>
                <p className="mt-1 text-xs text-gold-300">{viewing.admissionNo}</p>
              </div>
              <StatusBadge status={viewing.status} />
            </div>
            <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                ['Gender', viewing.gender], ['Date of birth', fmtDate(viewing.dob)], ['Blood group', viewing.bloodGroup ?? '—'], ['Admission date', fmtDate(viewing.admissionDate)],
                ["Father's name", viewing.fatherName], ["Mother's name", viewing.motherName], ['Email', viewing.email ?? '—'],
              ].map(([k, val]) => (
                <div key={k}><dt className="text-xs font-semibold uppercase tracking-wide text-navy-400">{k}</dt><dd className="mt-0.5 text-sm text-navy-900">{val}</dd></div>
              ))}
            </dl>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="flex items-start gap-2 rounded-xl bg-mist p-3 text-sm"><Phone className="mt-0.5 h-4 w-4 text-navy-400" />{viewing.phone}</div>
              <div className="flex items-start gap-2 rounded-xl bg-mist p-3 text-sm sm:col-span-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />{viewing.address}</div>
              <div className="flex items-start gap-2 rounded-xl bg-mist p-3 text-sm sm:col-span-3"><BusIcon className="mt-0.5 h-4 w-4 text-navy-400" />
                {viewing.busRouteId ? `${routeName(viewing.busRouteId)} · Stop: ${stopName(viewing.busRouteId, viewing.stopId) ?? '—'}` : 'Does not use school transport'}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={confirmDelete} loading={busy} title="Delete student?"
        message={`This will permanently remove ${deleting?.name ?? ''} and the linked fee account from the demo database.`} />
    </div>
  );
}
