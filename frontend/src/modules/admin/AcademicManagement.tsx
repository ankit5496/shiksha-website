import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Save, Trash2, BookOpen, Layers, CalendarDays } from 'lucide-react';
import clsx from 'clsx';
import type { ClassRoom, Exam, ExamResult, Subject, TimetableEntry, Weekday } from '@/types';
import { useCollection } from '@/hooks/useCollection';
import { useForm, v } from '@/hooks/useForm';
import { useToast } from '@/context/ToastContext';
import { Avatar, Badge, Button, ConfirmDialog, DataTable, EmptyState, Field, Input, Modal, PageHeader, Panel, Select, Spinner, StatCard, Tabs, type Column } from '@/components/ui';
import { gradeFor, subjectsForClass } from '@/data/seed';
import { fmtDate, fmtDay, uid } from '@/utils/format';
import { ChipPicker, useClasses } from './_shared';

const DAYS: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIMES = ['08:00 – 08:40', '08:40 – 09:20', '09:20 – 10:00', '10:20 – 11:00', '11:00 – 11:40', '11:40 – 12:20', '12:20 – 01:00'];
const STAGES: ClassRoom['stage'][] = ['Pre-Primary', 'Primary', 'Middle', 'Secondary'];
const splitCS = (cs: string) => { const i = cs.lastIndexOf('-'); return [cs.slice(0, i), cs.slice(i + 1)] as const; };

// ---------------- Classes ----------------
function ClassesTab() {
  const { classes, loading, create, update, remove } = useClasses();
  const { items: teachers } = useCollection('teachers');
  const { items: students } = useCollection('students');
  const toast = useToast();
  const [editing, setEditing] = useState<ClassRoom | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<ClassRoom | null>(null);
  const form = useForm({ name: '', stage: 'Primary', order: '', sections: 'A', classTeacherId: '' }, {
    name: [v.required()], order: [v.required(), v.min(0)],
    sections: [v.required(), (val) => (String(val).split(',').map((s) => s.trim()).filter(Boolean).length ? undefined : 'Enter at least one section')],
  });
  const openForm = (c?: ClassRoom) => {
    setEditing(c ?? null);
    form.reset({ name: c?.name ?? '', stage: c?.stage ?? 'Primary', order: String(c?.order ?? classes.length), sections: c?.sections.join(', ') ?? 'A', classTeacherId: c?.classTeacherId ?? '' });
    setOpen(true);
  };
  const save = form.handleSubmit(async (vals) => {
    const data = { name: vals.name.trim(), stage: vals.stage as ClassRoom['stage'], order: Number(vals.order), sections: [...new Set(vals.sections.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean))], classTeacherId: vals.classTeacherId || undefined };
    if (editing) await update(editing.id, data); else await create({ id: `c-${uid('').slice(1, 7)}`, ...data });
    toast.success(editing ? 'Class updated' : 'Class created', data.name);
    setOpen(false);
  });
  const count = (id: string) => students.filter((s) => s.classId === id).length;
  const cols: Column<ClassRoom>[] = [
    { key: 'name', header: 'Class', render: (c) => <span className="font-semibold">{c.name}</span> },
    { key: 'stage', header: 'Stage', render: (c) => <Badge tone={c.stage === 'Pre-Primary' ? 'gold' : c.stage === 'Primary' ? 'blue' : 'navy'}>{c.stage}</Badge> },
    { key: 'sections', header: 'Sections', value: (c) => c.sections.join(', '), render: (c) => <div className="flex gap-1">{c.sections.map((s) => <Badge key={s} tone="grey">{s}</Badge>)}</div> },
    { key: 'teacher', header: 'Class teacher', value: (c) => teachers.find((t) => t.id === c.classTeacherId)?.name ?? '', render: (c) => { const t = teachers.find((x) => x.id === c.classTeacherId); return t ? <div className="flex items-center gap-2"><Avatar src={t.photo} name={t.name} size={26} />{t.name}</div> : <span className="text-navy-300">Not assigned</span>; } },
    { key: 'students', header: 'Students', value: (c) => count(c.id) },
  ];
  return (
    <>
      <div className="mb-4 flex justify-end"><Button icon={<Plus className="h-4 w-4" />} onClick={() => openForm()}>Add class</Button></div>
      <DataTable rows={classes} columns={cols} loading={loading} pageSize={15}
        actions={(c) => <>
          <button className="btn-ghost btn-sm" onClick={() => openForm(c)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
          <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setDeleting(c)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
        </>} />
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit ${editing.name}` : 'Add class'}
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button loading={form.submitting} onClick={() => save()}>Save</Button></>}>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="Class name" required error={form.errors.name}><Input {...form.bind('name')} placeholder="e.g. Class 11" /></Field>
          <Field label="Stage"><Select {...form.bind('stage')} options={STAGES.map((s) => ({ value: s, label: s }))} /></Field>
          <Field label="Display order" required error={form.errors.order}><Input type="number" min={0} {...form.bind('order')} /></Field>
          <Field label="Sections" required error={form.errors.sections} hint="Comma separated, e.g. A, B, C"><Input {...form.bind('sections')} /></Field>
          <Field label="Class teacher" className="sm:col-span-2"><Select {...form.bind('classTeacherId')} placeholder="Not assigned" options={teachers.map((t) => ({ value: t.id, label: `${t.name} – ${t.designation}` }))} /></Field>
          <button type="submit" hidden />
        </form>
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} title="Delete class?"
        message={deleting && count(deleting.id) ? `${deleting.name} has ${count(deleting.id)} students. Move them to another class before deleting.` : `${deleting?.name ?? ''} will be removed.`}
        onConfirm={async () => {
          if (!deleting) return;
          if (count(deleting.id)) { toast.error('Class has students', 'Reassign students before deleting this class.'); setDeleting(null); return; }
          await remove(deleting.id); toast.success('Class deleted'); setDeleting(null);
        }} />
    </>
  );
}

// ---------------- Subjects ----------------
function SubjectsTab() {
  const { items, loading, create, update, remove } = useCollection('subjects');
  const { classOptions, name: className } = useClasses();
  const toast = useToast();
  const [editing, setEditing] = useState<Subject | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Subject | null>(null);
  const [fClass, setFClass] = useState('');
  const form = useForm<{ name: string; code: string; classIds: string[] }>({ name: '', code: '', classIds: [] }, { name: [v.required()], code: [v.required()], classIds: [v.required('Map the subject to at least one class')] });
  const openForm = (s?: Subject) => { setEditing(s ?? null); form.reset({ name: s?.name ?? '', code: s?.code ?? '', classIds: s ? [...s.classIds] : [] }); setOpen(true); };
  const save = form.handleSubmit(async (vals) => {
    const data = { name: vals.name.trim(), code: vals.code.trim().toUpperCase(), classIds: vals.classIds };
    if (editing) await update(editing.id, data); else await create({ id: `sub-${data.name.toLowerCase().replace(/[^a-z]+/g, '-')}-${uid('').slice(1, 5)}`, ...data });
    toast.success(editing ? 'Subject updated' : 'Subject added', data.name);
    setOpen(false);
  });
  const rows = items.filter((s) => !fClass || s.classIds.includes(fClass));
  const cols: Column<Subject>[] = [
    { key: 'name', header: 'Subject', render: (s) => <span className="font-semibold">{s.name}</span> },
    { key: 'code', header: 'Code' },
    { key: 'classIds', header: 'Taught in', value: (s) => s.classIds.map(className).join(', '), render: (s) => <div className="flex max-w-md flex-wrap gap-1">{s.classIds.map((c) => <Badge key={c} tone="grey">{className(c)}</Badge>)}</div> },
  ];
  return (
    <>
      <div className="mb-4 flex justify-end"><Button icon={<Plus className="h-4 w-4" />} onClick={() => openForm()}>Add subject</Button></div>
      <DataTable rows={rows} columns={cols} loading={loading}
        toolbar={<Select className="w-40" value={fClass} onChange={(e) => setFClass(e.target.value)} placeholder="All classes" options={classOptions} aria-label="Class" />}
        actions={(s) => <>
          <button className="btn-ghost btn-sm" onClick={() => openForm(s)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
          <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setDeleting(s)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
        </>} />
      <Modal open={open} onClose={() => setOpen(false)} size="lg" title={editing ? `Edit ${editing.name}` : 'Add subject'}
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button loading={form.submitting} onClick={() => save()}>Save</Button></>}>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="Subject name" required error={form.errors.name}><Input {...form.bind('name')} /></Field>
          <Field label="Subject code" required error={form.errors.code}><Input {...form.bind('code')} /></Field>
          <Field label="Classes" required error={form.errors.classIds} className="sm:col-span-2"><ChipPicker options={classOptions} value={form.values.classIds} onChange={(val) => form.set('classIds', val)} /></Field>
          <button type="submit" hidden />
        </form>
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} title="Delete subject?" message={`${deleting?.name ?? ''} will be removed from all classes.`}
        onConfirm={async () => { if (deleting) { await remove(deleting.id); toast.success('Subject deleted'); setDeleting(null); } }} />
    </>
  );
}

// ---------------- Timetable ----------------
function TimetableTab() {
  const { classSections } = useClasses();
  const { items, loading, bulkUpsert, remove } = useCollection('timetable');
  const { items: teachers } = useCollection('teachers');
  const toast = useToast();
  const [cs, setCs] = useState(classSections.find((o) => o.value === 'c8-A') ? 'c8-A' : '');
  const [draft, setDraft] = useState<Record<string, { subject: string; teacherName: string }>>({});
  const [cell, setCell] = useState<{ day: Weekday; period: number } | null>(null);
  const [cSub, setCSub] = useState('');
  const [cTeacher, setCTeacher] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!cs && classSections.length) setCs((classSections.find((o) => o.value === 'c8-A') ?? classSections[0]).value); }, [classSections, cs]);
  const [classId, section] = cs ? splitCS(cs) : ['', ''];
  const entries = useMemo(() => items.filter((t) => t.classId === classId && t.section === section), [items, classId, section]);
  useEffect(() => { setDraft({}); }, [cs]);
  const key = (d: Weekday, p: number) => `${d}-${p}`;
  const get = (d: Weekday, p: number) => draft[key(d, p)] ?? entries.find((e) => e.day === d && e.period === p);
  const dirty = Object.keys(draft).length > 0;
  const subjOpts = [...subjectsForClass(classId), 'Physical Education', 'Library', 'Free Period'];

  const openCell = (day: Weekday, period: number) => { const e = get(day, period); setCell({ day, period }); setCSub(e?.subject ?? ''); setCTeacher(e?.teacherName ?? ''); };
  const applyCell = () => {
    if (!cell) return;
    setDraft((d) => ({ ...d, [key(cell.day, cell.period)]: { subject: cSub, teacherName: cTeacher || 'To be assigned' } }));
    setCell(null);
  };
  const save = async () => {
    setSaving(true);
    try {
      const upserts: TimetableEntry[] = [];
      const removals: string[] = [];
      Object.entries(draft).forEach(([k, val]) => {
        const [day, p] = k.split('-');
        const id = `tt-${classId}-${section}-${day}-${p}`;
        const existing = entries.find((e) => e.day === day && e.period === Number(p));
        if (!val.subject) { if (existing) removals.push(existing.id); return; }
        upserts.push({ id: existing?.id ?? id, classId, section, day: day as Weekday, period: Number(p), time: TIMES[Number(p) - 1], subject: val.subject, teacherName: val.teacherName });
      });
      if (upserts.length) await bulkUpsert(upserts);
      for (const id of removals) await remove(id);
      setDraft({});
      toast.success('Timetable saved', `${classSections.find((o) => o.value === cs)?.label} updated (${upserts.length + removals.length} periods).`);
    } catch (e) { toast.error('Could not save', (e as Error).message); } finally { setSaving(false); }
  };
  return (
    <div className="space-y-4">
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
        <Field label="Class & section" className="sm:w-64"><Select value={cs} onChange={(e) => setCs(e.target.value)} options={classSections} /></Field>
        <div className="flex items-center gap-2">
          {dirty && <Badge tone="amber" dot>{Object.keys(draft).length} unsaved change(s)</Badge>}
          {dirty && <Button variant="outline" onClick={() => setDraft({})}>Discard</Button>}
          <Button icon={<Save className="h-4 w-4" />} loading={saving} disabled={!dirty} onClick={save}>Save timetable</Button>
        </div>
      </div>
      {loading ? <Spinner /> : (
        <div className="card scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr><th className="w-20 bg-mist px-3 py-3 text-left text-xs font-semibold uppercase text-navy-500">Day</th>
                {TIMES.map((t, i) => <th key={t} className="bg-mist px-2 py-3 text-center text-xs font-semibold text-navy-500">P{i + 1}<span className="block font-normal text-navy-400">{t}</span></th>)}</tr>
            </thead>
            <tbody>
              {DAYS.map((d) => (
                <tr key={d} className="border-t border-navy-50">
                  <td className="px-3 py-2 font-semibold text-navy-700">{d}</td>
                  {TIMES.map((_, i) => {
                    const e = get(d, i + 1);
                    const changed = !!draft[key(d, i + 1)];
                    return (
                      <td key={i} className="p-1">
                        <button onClick={() => openCell(d, i + 1)} className={clsx('h-16 w-full rounded-lg border px-2 text-left transition hover:border-gold-400 hover:bg-gold-50/50', changed ? 'border-gold-400 bg-gold-50' : e?.subject ? 'border-navy-100 bg-white' : 'border-dashed border-navy-200 bg-mist/40')}>
                          {e?.subject ? <><span className="block truncate text-xs font-semibold text-navy-900">{e.subject}</span><span className="block truncate text-[11px] text-navy-400">{e.teacherName}</span></> : <span className="text-xs text-navy-300">+ Add</span>}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={!!cell} onClose={() => setCell(null)} size="sm" title={cell ? `${cell.day} · Period ${cell.period}` : ''} subtitle={cell ? TIMES[cell.period - 1] : ''}
        footer={<><Button variant="outline" onClick={() => setCell(null)}>Cancel</Button><Button onClick={applyCell}>Apply</Button></>}>
        <div className="space-y-4">
          <Field label="Subject"><Select value={cSub} onChange={(e) => setCSub(e.target.value)} placeholder="— Empty period —" options={subjOpts.map((s) => ({ value: s, label: s }))} /></Field>
          <Field label="Teacher"><Select value={cTeacher} onChange={(e) => setCTeacher(e.target.value)} placeholder="To be assigned"
            options={[...teachers].sort((a, b) => Number(b.subjects.includes(cSub)) - Number(a.subjects.includes(cSub))).map((t) => ({ value: t.name, label: `${t.name}${t.subjects.includes(cSub) ? ' ★' : ''}` }))} /></Field>
          <p className="text-xs text-navy-400">★ teaches this subject</p>
        </div>
      </Modal>
    </div>
  );
}

// ---------------- Exams ----------------
function ExamsTab() {
  const { items, loading, create, update, remove } = useCollection('exams');
  const { classOptions, name: className } = useClasses();
  const toast = useToast();
  const [fClass, setFClass] = useState('');
  const [editing, setEditing] = useState<Exam | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Exam | null>(null);
  const form = useForm({ name: 'Half-Yearly Examination', classId: '', subject: '', date: '', time: '09:00 AM – 12:00 PM', maxMarks: '80', room: '' }, {
    name: [v.required()], classId: [v.required()], subject: [v.required()], date: [v.required()], time: [v.required()], maxMarks: [v.required(), v.min(1)],
  });
  const openForm = (e?: Exam) => {
    setEditing(e ?? null);
    form.reset({ name: e?.name ?? 'Half-Yearly Examination', classId: e?.classId ?? fClass, subject: e?.subject ?? '', date: e?.date ?? '', time: e?.time ?? '09:00 AM – 12:00 PM', maxMarks: String(e?.maxMarks ?? 80), room: e?.room ?? '' });
    setOpen(true);
  };
  const save = form.handleSubmit(async (vals) => {
    const data = { ...vals, maxMarks: Number(vals.maxMarks), room: vals.room || undefined };
    if (editing) await update(editing.id, data); else await create(data);
    toast.success(editing ? 'Exam updated' : 'Exam scheduled', `${data.subject} · ${className(data.classId)} · ${fmtDate(data.date)}`);
    setOpen(false);
  });
  const rows = items.filter((e) => !fClass || e.classId === fClass).sort((a, b) => a.date.localeCompare(b.date));
  const cols: Column<Exam>[] = [
    { key: 'date', header: 'Date', render: (e) => <span className="whitespace-nowrap font-medium">{fmtDay(e.date)}</span> },
    { key: 'name', header: 'Examination' },
    { key: 'class', header: 'Class', value: (e) => className(e.classId) },
    { key: 'subject', header: 'Subject', render: (e) => <Badge tone="gold">{e.subject}</Badge> },
    { key: 'time', header: 'Time' },
    { key: 'maxMarks', header: 'Max marks' },
    { key: 'room', header: 'Venue', render: (e) => e.room ?? '—' },
  ];
  return (
    <>
      <div className="mb-4 flex justify-end"><Button icon={<Plus className="h-4 w-4" />} onClick={() => openForm()}>Schedule exam</Button></div>
      <DataTable rows={rows} columns={cols} loading={loading}
        toolbar={<Select className="w-40" value={fClass} onChange={(e) => setFClass(e.target.value)} placeholder="All classes" options={classOptions} aria-label="Class" />}
        actions={(e) => <>
          <button className="btn-ghost btn-sm" onClick={() => openForm(e)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
          <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setDeleting(e)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
        </>} />
      <Modal open={open} onClose={() => setOpen(false)} size="lg" title={editing ? 'Edit exam' : 'Schedule exam'}
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button loading={form.submitting} onClick={() => save()}>Save</Button></>}>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="Examination" required error={form.errors.name} className="sm:col-span-2"><Input {...form.bind('name')} /></Field>
          <Field label="Class" required error={form.errors.classId}><Select value={form.values.classId} onChange={(e) => { form.set('classId', e.target.value); form.set('subject', ''); }} invalid={!!form.errors.classId} placeholder="Select class" options={classOptions} /></Field>
          <Field label="Subject" required error={form.errors.subject}><Select {...form.bind('subject')} placeholder="Select subject" options={(form.values.classId ? subjectsForClass(form.values.classId) : []).map((s) => ({ value: s, label: s }))} /></Field>
          <Field label="Date" required error={form.errors.date}><Input type="date" {...form.bind('date')} /></Field>
          <Field label="Time" required error={form.errors.time}><Input {...form.bind('time')} /></Field>
          <Field label="Maximum marks" required error={form.errors.maxMarks}><Input type="number" min={1} {...form.bind('maxMarks')} /></Field>
          <Field label="Venue / room"><Input {...form.bind('room')} placeholder="e.g. Exam Hall 1" /></Field>
          <button type="submit" hidden />
        </form>
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} title="Delete exam?" message={`${deleting?.subject ?? ''} exam on ${fmtDate(deleting?.date)} will be removed from the schedule.`}
        onConfirm={async () => { if (deleting) { await remove(deleting.id); toast.success('Exam removed'); setDeleting(null); } }} />
    </>
  );
}

// ---------------- Results ----------------
function ResultsTab() {
  const { classSections } = useClasses();
  const { items: results, loading, bulkUpsert } = useCollection('results');
  const { items: exams } = useCollection('exams');
  const { items: students } = useCollection('students');
  const toast = useToast();
  const examNames = useMemo(() => [...new Set([...results.map((r) => r.examName), ...exams.map((e) => e.name)])], [results, exams]);
  const [examName, setExamName] = useState('');
  const [cs, setCs] = useState('c8-A');
  const [subject, setSubject] = useState('');
  const [maxMarks, setMaxMarks] = useState('20');
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!examName && examNames.length) setExamName(examNames[0]); }, [examNames, examName]);
  const [classId, section] = cs ? splitCS(cs) : ['', ''];
  const subjects = subjectsForClass(classId);
  useEffect(() => { if (!subjects.includes(subject)) setSubject(subjects[0] ?? ''); }, [classId]); // eslint-disable-line react-hooks/exhaustive-deps
  const roster = useMemo(() => students.filter((s) => s.classId === classId && s.section === section).sort((a, b) => a.rollNo - b.rollNo), [students, classId, section]);
  const existing = useMemo(() => results.filter((r) => r.examName === examName && r.subject === subject), [results, examName, subject]);
  useEffect(() => {
    const m: Record<string, string> = {};
    roster.forEach((s) => { const r = existing.find((x) => x.studentId === s.id); m[s.id] = r ? String(r.marks) : ''; });
    setMarks(m);
    const anyR = existing.find((r) => roster.some((s) => s.id === r.studentId));
    const ex = exams.find((e) => e.name === examName && e.classId === classId && e.subject === subject);
    setMaxMarks(String(anyR?.maxMarks ?? ex?.maxMarks ?? 20));
  }, [roster, existing, exams, examName, classId, subject]);
  const max = Number(maxMarks) || 0;
  const invalid = Object.values(marks).some((m) => m !== '' && (Number(m) < 0 || Number(m) > max || Number.isNaN(Number(m))));
  const save = async () => {
    if (invalid) { toast.error('Check the marks', `Marks must be between 0 and ${max}.`); return; }
    const rows: ExamResult[] = roster.filter((s) => marks[s.id] !== '').map((s) => {
      const m = Number(marks[s.id]);
      const ex = existing.find((x) => x.studentId === s.id);
      return { id: ex?.id ?? `rs-${s.id}-${examName.replace(/\s+/g, '')}-${subject.replace(/\s+/g, '')}`, studentId: s.id, examName, subject, marks: m, maxMarks: max, grade: gradeFor((m / max) * 100) };
    });
    if (!rows.length) { toast.error('No marks entered'); return; }
    setSaving(true);
    try { await bulkUpsert(rows); toast.success('Results saved', `${rows.length} results for ${subject} · ${examName}`); } finally { setSaving(false); }
  };
  const entered = roster.filter((s) => marks[s.id] !== '');
  const avg = entered.length ? Math.round(entered.reduce((a, s) => a + Number(marks[s.id]), 0) / entered.length * 10) / 10 : 0;
  return (
    <div className="space-y-4">
      <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Examination"><Select value={examName} onChange={(e) => setExamName(e.target.value)} options={examNames.map((n) => ({ value: n, label: n }))} /></Field>
        <Field label="Class & section"><Select value={cs} onChange={(e) => setCs(e.target.value)} options={classSections} /></Field>
        <Field label="Subject"><Select value={subject} onChange={(e) => setSubject(e.target.value)} options={subjects.map((s) => ({ value: s, label: s }))} /></Field>
        <Field label="Maximum marks"><Input type="number" min={1} value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} /></Field>
      </div>
      <Panel title={`${subject} · ${examName}`} subtitle={`${entered.length}/${roster.length} entered · class average ${avg}/${max}`} bodyClassName="p-0"
        action={<Button icon={<Save className="h-4 w-4" />} loading={saving} disabled={!roster.length} onClick={save}>Save results</Button>}>
        {loading ? <Spinner /> : roster.length === 0 ? <EmptyState title="No students in this section" /> : (
          <div className="scrollbar-thin overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>Roll</th><th>Student</th><th>Marks (out of {max})</th><th>%</th><th>Grade</th></tr></thead>
              <tbody>
                {roster.map((s) => {
                  const val = marks[s.id] ?? '';
                  const bad = val !== '' && (Number(val) < 0 || Number(val) > max);
                  const pct = val !== '' && max ? Math.round((Number(val) / max) * 100) : null;
                  return (
                    <tr key={s.id}>
                      <td className="w-14">{s.rollNo}</td>
                      <td><div className="flex items-center gap-2"><Avatar src={s.photo} name={s.name} size={28} />{s.name}</div></td>
                      <td className="w-40"><Input type="number" min={0} max={max} value={val} invalid={bad} onChange={(e) => setMarks((m) => ({ ...m, [s.id]: e.target.value }))} aria-label={`Marks for ${s.name}`} className="py-1.5" /></td>
                      <td className="w-16">{pct ?? '—'}</td>
                      <td className="w-20">{pct !== null && !bad ? <Badge tone={pct >= 71 ? 'green' : pct >= 41 ? 'amber' : 'red'}>{gradeFor(pct)}</Badge> : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

type Tab = 'classes' | 'subjects' | 'timetable' | 'exams' | 'results';
export default function AcademicManagement() {
  const [tab, setTab] = useState<Tab>('classes');
  const { classes } = useClasses();
  const { items: subjects } = useCollection('subjects');
  const { items: exams } = useCollection('exams');
  const upcoming = exams.filter((e) => e.date >= new Date().toISOString().slice(0, 10)).length;
  return (
    <div>
      <PageHeader eyebrow="Academic Management" title="Academics" subtitle="Classes, subjects, timetables, examinations and results" />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Classes" value={classes.length} hint={`${classes.reduce((a, c) => a + c.sections.length, 0)} sections`} icon={<Layers className="h-5 w-5" />} />
        <StatCard label="Subjects" value={subjects.length} icon={<BookOpen className="h-5 w-5" />} tone="gold" />
        <StatCard label="Upcoming exam papers" value={upcoming} icon={<CalendarDays className="h-5 w-5" />} tone="blue" />
      </div>
      <Tabs className="mb-5 w-fit max-w-full" value={tab} onChange={setTab} tabs={[
        { value: 'classes', label: 'Classes' }, { value: 'subjects', label: 'Subjects' }, { value: 'timetable', label: 'Timetable' },
        { value: 'exams', label: 'Exam Schedule' }, { value: 'results', label: 'Results Entry' },
      ]} />
      {tab === 'classes' && <ClassesTab />}
      {tab === 'subjects' && <SubjectsTab />}
      {tab === 'timetable' && <TimetableTab />}
      {tab === 'exams' && <ExamsTab />}
      {tab === 'results' && <ResultsTab />}
    </div>
  );
}
