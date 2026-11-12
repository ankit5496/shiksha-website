import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Bus as BusIcon, MapPin, Pencil, Phone, Plus, Route as RouteIcon, Trash2, UserMinus, UserPlus, Users } from 'lucide-react';
import type { Bus, BusRoute, BusStop, Driver, Student } from '@/types';
import { useCollection } from '@/hooks/useCollection';
import { useForm, v } from '@/hooks/useForm';
import { useToast } from '@/context/ToastContext';
import { Avatar, Badge, Button, ConfirmDialog, DataTable, Field, Input, Modal, PageHeader, ProgressBar, SearchSelect, Select, StatCard, StatusBadge, Tabs, type Column } from '@/components/ui';
import { avatar } from '@/data/images';
import TransportMonitor from '@/modules/transport/TransportMonitor';
import { uid } from '@/utils/format';
import { useClasses } from './_shared';

function densify(points: [number, number][], steps = 10): [number, number][] {
  if (points.length < 2) return points;
  const out: [number, number][] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [a, b] = [points[i], points[i + 1]];
    for (let s = 0; s < steps; s++) out.push([a[0] + ((b[0] - a[0]) * s) / steps, a[1] + ((b[1] - a[1]) * s) / steps]);
  }
  out.push(points[points.length - 1]);
  return out;
}

// ---------------- Buses ----------------
function Buses() {
  const { items, loading, create, update, remove } = useCollection('buses');
  const { items: drivers } = useCollection('drivers');
  const { items: routes } = useCollection('routes');
  const { items: students } = useCollection('students');
  const toast = useToast();
  const [editing, setEditing] = useState<Bus | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Bus | null>(null);
  const form = useForm({ number: '', registration: '', capacity: '40', driverId: '', routeId: '', attendantName: '', status: 'Active' }, {
    number: [v.required()], registration: [v.required()], capacity: [v.required(), v.min(10), v.max(80)], driverId: [v.required('Assign a driver')], routeId: [v.required('Assign a route')], attendantName: [v.required()],
  });
  const openForm = (b?: Bus) => {
    setEditing(b ?? null);
    form.reset({ number: b?.number ?? `Bus ${String(items.length + 1).padStart(2, '0')}`, registration: b?.registration ?? '', capacity: String(b?.capacity ?? 40), driverId: b?.driverId ?? '', routeId: b?.routeId ?? '', attendantName: b?.attendantName ?? '', status: b?.status ?? 'Active' });
    setOpen(true);
  };
  const save = form.handleSubmit(async (vals) => {
    const clash = items.find((b) => b.driverId === vals.driverId && b.id !== editing?.id);
    if (clash) { toast.error('Driver already assigned', `${drivers.find((d) => d.id === vals.driverId)?.name} drives ${clash.number}.`); return; }
    const data = { ...vals, capacity: Number(vals.capacity), status: vals.status as Bus['status'] };
    if (editing) await update(editing.id, data); else await create(data);
    toast.success(editing ? 'Bus updated' : 'Bus added', data.number);
    setOpen(false);
  });
  const load = (b: Bus) => students.filter((s) => s.busRouteId === b.routeId).length;
  const cols: Column<Bus>[] = [
    { key: 'number', header: 'Bus', render: (b) => <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-50 text-gold-700"><BusIcon className="h-4 w-4" /></span><div><p className="font-semibold">{b.number}</p><p className="text-xs text-navy-400">{b.registration}</p></div></div>, value: (b) => `${b.number} ${b.registration}` },
    { key: 'route', header: 'Route', value: (b) => routes.find((r) => r.id === b.routeId)?.name ?? '', render: (b) => { const r = routes.find((x) => x.id === b.routeId); return r ? <div><Badge tone="blue">{r.code}</Badge><p className="mt-0.5 text-xs text-navy-500">{r.name}</p></div> : '—'; } },
    { key: 'driver', header: 'Driver', value: (b) => drivers.find((d) => d.id === b.driverId)?.name ?? '', render: (b) => { const d = drivers.find((x) => x.id === b.driverId); return d ? <div className="flex items-center gap-2"><Avatar src={d.photo} name={d.name} size={28} /><div><p className="text-sm">{d.name}</p><p className="text-xs text-navy-400">{d.phone}</p></div></div> : <span className="text-navy-300">Unassigned</span>; } },
    { key: 'attendantName', header: 'Attendant' },
    { key: 'load', header: 'Occupancy', value: (b) => load(b), render: (b) => <div className="min-w-[110px]"><p className="mb-1 text-xs">{load(b)} / {b.capacity}</p><ProgressBar value={(load(b) / b.capacity) * 100} tone={load(b) > b.capacity ? 'red' : 'navy'} /></div> },
    { key: 'status', header: 'Status', render: (b) => <StatusBadge status={b.status} /> },
  ];
  return (
    <>
      <div className="mb-4 flex justify-end"><Button icon={<Plus className="h-4 w-4" />} onClick={() => openForm()}>Add bus</Button></div>
      <DataTable rows={items} columns={cols} loading={loading}
        actions={(b) => <>
          <button className="btn-ghost btn-sm" onClick={() => openForm(b)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
          <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setDeleting(b)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
        </>} />
      <Modal open={open} onClose={() => setOpen(false)} size="lg" title={editing ? `Edit ${editing.number}` : 'Add bus'}
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button loading={form.submitting} onClick={() => save()}>Save</Button></>}>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="Bus name / number" required error={form.errors.number}><Input {...form.bind('number')} /></Field>
          <Field label="Registration no." required error={form.errors.registration}><Input {...form.bind('registration')} placeholder="RJ-36-PA-0000" /></Field>
          <Field label="Seating capacity" required error={form.errors.capacity}><Input type="number" {...form.bind('capacity')} /></Field>
          <Field label="Status"><Select {...form.bind('status')} options={[{ value: 'Active', label: 'Active' }, { value: 'Maintenance', label: 'Maintenance' }]} /></Field>
          <Field label="Driver" required error={form.errors.driverId}><Select {...form.bind('driverId')} placeholder="Select driver" options={drivers.map((d) => ({ value: d.id, label: d.name }))} /></Field>
          <Field label="Route" required error={form.errors.routeId}><Select {...form.bind('routeId')} placeholder="Select route" options={routes.map((r) => ({ value: r.id, label: `${r.code} · ${r.name}` }))} /></Field>
          <Field label="Lady attendant" required error={form.errors.attendantName} className="sm:col-span-2"><Input {...form.bind('attendantName')} /></Field>
          <button type="submit" hidden />
        </form>
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} title="Remove bus?" message={`${deleting?.number ?? ''} will be removed from the fleet.`}
        onConfirm={async () => { if (deleting) { await remove(deleting.id); toast.success('Bus removed'); setDeleting(null); } }} />
    </>
  );
}

// ---------------- Drivers ----------------
function Drivers() {
  const { items, loading, create, update, remove } = useCollection('drivers');
  const { items: buses } = useCollection('buses');
  const toast = useToast();
  const [editing, setEditing] = useState<Driver | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Driver | null>(null);
  const form = useForm({ name: '', phone: '', licenseNo: '', experienceYears: '' }, { name: [v.required()], phone: [v.required(), v.phone()], licenseNo: [v.required()], experienceYears: [v.required(), v.min(0)] });
  const openForm = (d?: Driver) => { setEditing(d ?? null); form.reset({ name: d?.name ?? '', phone: d?.phone ?? '', licenseNo: d?.licenseNo ?? '', experienceYears: d ? String(d.experienceYears) : '' }); setOpen(true); };
  const save = form.handleSubmit(async (vals) => {
    const data = { ...vals, experienceYears: Number(vals.experienceYears), photo: editing?.photo ?? avatar(vals.name, 'F5EBCD', '5B3F21') };
    if (editing) await update(editing.id, data); else await create(data);
    toast.success(editing ? 'Driver updated' : 'Driver added', data.name);
    setOpen(false);
  });
  const cols: Column<Driver>[] = [
    { key: 'name', header: 'Driver', render: (d) => <div className="flex items-center gap-2"><Avatar src={d.photo} name={d.name} size={32} /><span className="font-medium">{d.name}</span></div> },
    { key: 'phone', header: 'Phone', render: (d) => <a href={`tel:${d.phone}`} className="flex items-center gap-1 hover:text-gold-700"><Phone className="h-3.5 w-3.5" />{d.phone}</a> },
    { key: 'licenseNo', header: 'Licence no.' },
    { key: 'experienceYears', header: 'Experience', render: (d) => `${d.experienceYears} yrs` },
    { key: 'bus', header: 'Assigned bus', value: (d) => buses.find((b) => b.driverId === d.id)?.number ?? '', render: (d) => { const b = buses.find((x) => x.driverId === d.id); return b ? <Badge tone="gold">{b.number}</Badge> : <span className="text-navy-300">—</span>; } },
  ];
  return (
    <>
      <div className="mb-4 flex justify-end"><Button icon={<Plus className="h-4 w-4" />} onClick={() => openForm()}>Add driver</Button></div>
      <DataTable rows={items} columns={cols} loading={loading}
        actions={(d) => <>
          <button className="btn-ghost btn-sm" onClick={() => openForm(d)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
          <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setDeleting(d)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
        </>} />
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit driver' : 'Add driver'}
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button loading={form.submitting} onClick={() => save()}>Save</Button></>}>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required error={form.errors.name} className="sm:col-span-2"><Input {...form.bind('name')} /></Field>
          <Field label="Mobile" required error={form.errors.phone}><Input {...form.bind('phone')} /></Field>
          <Field label="Experience (years)" required error={form.errors.experienceYears}><Input type="number" min={0} {...form.bind('experienceYears')} /></Field>
          <Field label="Driving licence no." required error={form.errors.licenseNo} className="sm:col-span-2"><Input {...form.bind('licenseNo')} /></Field>
          <button type="submit" hidden />
        </form>
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} title="Remove driver?"
        message={deleting && buses.some((b) => b.driverId === deleting.id) ? `${deleting.name} is assigned to a bus. Reassign the bus first.` : `${deleting?.name ?? ''} will be removed.`}
        onConfirm={async () => {
          if (!deleting) return;
          if (buses.some((b) => b.driverId === deleting.id)) { toast.error('Driver is assigned to a bus'); setDeleting(null); return; }
          await remove(deleting.id); toast.success('Driver removed'); setDeleting(null);
        }} />
    </>
  );
}

// ---------------- Routes ----------------
function Routes() {
  const { items, loading, create, update, remove } = useCollection('routes');
  const { items: buses } = useCollection('buses');
  const { items: students } = useCollection('students');
  const toast = useToast();
  const [editing, setEditing] = useState<BusRoute | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<BusRoute | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [stops, setStops] = useState<BusStop[]>([]);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const openForm = (r?: BusRoute) => {
    setEditing(r ?? null); setErr('');
    setCode(r?.code ?? `R-${String(items.length + 1).padStart(2, '0')}`); setName(r?.name ?? '');
    setStops(r ? r.stops.map((s) => ({ ...s })) : [
      { id: uid('st'), name: '', lat: 26.1, lng: 74.32, time: '07:00' },
      { id: uid('st'), name: 'School Campus', lat: 26.1052, lng: 74.3268, time: '07:40' },
    ]);
    setOpen(true);
  };
  const setStop = (i: number, patch: Partial<BusStop>) => setStops((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: -1 | 1) => setStops((s) => { const n = [...s]; const j = i + d; if (j < 0 || j >= n.length) return s; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const save = async () => {
    if (!code.trim() || !name.trim()) return setErr('Route code and name are required.');
    if (stops.length < 2) return setErr('A route needs at least two stops.');
    if (stops.some((s) => !s.name.trim() || !s.time || Number.isNaN(s.lat) || Number.isNaN(s.lng))) return setErr('Every stop needs a name, time and valid coordinates.');
    setSaving(true);
    try {
      const rid = editing?.id ?? `r-${uid('').slice(1, 7)}`;
      const st = stops.map((s, i) => ({ ...s, id: s.id.startsWith(`${rid}-`) ? s.id : `${rid}-s${i + 1}-${uid('').slice(1, 4)}`, lat: Number(s.lat), lng: Number(s.lng) }));
      const data = { code: code.trim(), name: name.trim(), stops: st, path: densify(st.map((s) => [s.lat, s.lng] as [number, number])) };
      if (editing) await update(editing.id, data); else await create({ id: rid, ...data });
      toast.success(editing ? 'Route updated' : 'Route created', `${data.code} · ${data.stops.length} stops`);
      setOpen(false);
    } finally { setSaving(false); }
  };
  const cols: Column<BusRoute>[] = [
    { key: 'code', header: 'Code', render: (r) => <Badge tone="blue">{r.code}</Badge> },
    { key: 'name', header: 'Route', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'stops', header: 'Stops', value: (r) => r.stops.map((s) => s.name).join(' → '), render: (r) => <p className="max-w-md text-xs text-navy-500">{r.stops.map((s) => s.name).join(' → ')}</p> },
    { key: 'timing', header: 'Timing', value: (r) => r.stops[0]?.time ?? '', render: (r) => `${r.stops[0]?.time} – ${r.stops[r.stops.length - 1]?.time}` },
    { key: 'bus', header: 'Bus', value: (r) => buses.find((b) => b.routeId === r.id)?.number ?? '', render: (r) => buses.find((b) => b.routeId === r.id)?.number ?? <span className="text-navy-300">—</span> },
    { key: 'riders', header: 'Students', value: (r) => students.filter((s) => s.busRouteId === r.id).length },
  ];
  return (
    <>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-navy-400">Stop coordinates are simulated for the demo. Connect a GPS device feed to replace them with live data.</p>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => openForm()}>Add route</Button>
      </div>
      <DataTable rows={items} columns={cols} loading={loading}
        actions={(r) => <>
          <button className="btn-ghost btn-sm" onClick={() => openForm(r)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
          <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setDeleting(r)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
        </>} />
      <Modal open={open} onClose={() => setOpen(false)} size="xl" title={editing ? `Edit route ${editing.code}` : 'Add route'}
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button loading={saving} onClick={save}>Save route</Button></>}>
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
            <Field label="Route code"><Input value={code} onChange={(e) => setCode(e.target.value)} /></Field>
            <Field label="Route name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ajmeri Gate – Sendra Road" /></Field>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between"><p className="label mb-0">Stops (in order)</p>
              <button className="btn-ghost btn-sm" onClick={() => setStops((s) => { const last = s[s.length - 1]; return [...s.slice(0, -1), { id: uid('st'), name: '', lat: last?.lat ?? 26.1, lng: last?.lng ?? 74.32, time: last?.time ?? '07:30' }, ...(last ? [last] : [])]; })}><Plus className="h-3.5 w-3.5" />Add stop</button>
            </div>
            <div className="space-y-2">
              {stops.map((s, i) => (
                <div key={s.id} className="grid grid-cols-2 gap-2 rounded-xl border border-navy-50 bg-mist/40 p-2 sm:grid-cols-[28px_1fr_96px_110px_110px_auto] sm:items-center">
                  <span className="hidden h-7 w-7 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white sm:flex">{i + 1}</span>
                  <Input className="col-span-2 sm:col-span-1" placeholder="Stop name" value={s.name} onChange={(e) => setStop(i, { name: e.target.value })} aria-label="Stop name" />
                  <Input type="time" value={s.time} onChange={(e) => setStop(i, { time: e.target.value })} aria-label="Time" />
                  <Input type="number" step="0.0001" value={s.lat} onChange={(e) => setStop(i, { lat: Number(e.target.value) })} aria-label="Latitude" />
                  <Input type="number" step="0.0001" value={s.lng} onChange={(e) => setStop(i, { lng: Number(e.target.value) })} aria-label="Longitude" />
                  <div className="flex justify-end gap-0.5">
                    <button className="btn-ghost btn-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button className="btn-ghost btn-sm" onClick={() => move(i, 1)} disabled={i === stops.length - 1} aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></button>
                    <button className="btn-ghost btn-sm text-red-600" onClick={() => setStops((x) => x.filter((_, j) => j !== i))} aria-label="Remove stop"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-navy-400">Columns: stop name · scheduled time · latitude · longitude. The last stop is normally the school campus.</p>
          </div>
          {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        </div>
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} title="Delete route?"
        message={deleting && buses.some((b) => b.routeId === deleting.id) ? 'A bus is running on this route. Reassign the bus first.' : `${deleting?.name ?? ''} will be deleted and its students unassigned.`}
        onConfirm={async () => {
          if (!deleting) return;
          if (buses.some((b) => b.routeId === deleting.id)) { toast.error('Route in use', 'Reassign the bus before deleting.'); setDeleting(null); return; }
          await remove(deleting.id); toast.success('Route deleted'); setDeleting(null);
        }} />
    </>
  );
}

// ---------------- Student assignment ----------------
function StudentAssignment() {
  const { items: students, loading, update } = useCollection('students');
  const { items: routes } = useCollection('routes');
  const studentFees = useCollection('studentFees');
  const { name: className } = useClasses();
  const toast = useToast();
  const [fRoute, setFRoute] = useState('');
  const [open, setOpen] = useState(false);
  const [sid, setSid] = useState('');
  const [rid, setRid] = useState('');
  const [stop, setStop] = useState('');
  const [err, setErr] = useState('');
  const routeOf = (id?: string) => routes.find((r) => r.id === id);
  const rows = useMemo(() => students.filter((s) => (fRoute === '' ? !!s.busRouteId : fRoute === 'none' ? !s.busRouteId : s.busRouteId === fRoute)), [students, fRoute]);
  const openAssign = (s?: Student) => { setSid(s?.id ?? ''); setRid(s?.busRouteId ?? (fRoute && fRoute !== 'none' ? fRoute : '')); setStop(s?.stopId ?? ''); setErr(''); setOpen(true); };
  const syncFee = async (studentId: string, uses: boolean) => {
    const sf = studentFees.items.find((x) => x.studentId === studentId);
    if (sf && (sf.transportFee > 0) !== uses) await studentFees.update(sf.id, { transportFee: uses ? 9600 : 0 });
  };
  const assign = async () => {
    if (!sid) return setErr('Select a student.');
    if (!rid) return setErr('Select a route.');
    if (!stop) return setErr('Select a pick-up stop.');
    await update(sid, { busRouteId: rid, stopId: stop });
    await syncFee(sid, true);
    const s = students.find((x) => x.id === sid);
    toast.success('Transport assigned', `${s?.name} → ${routeOf(rid)?.code}, ${routeOf(rid)?.stops.find((x) => x.id === stop)?.name}`);
    setOpen(false);
  };
  const unassign = async (s: Student) => {
    await update(s.id, { busRouteId: undefined, stopId: undefined });
    await syncFee(s.id, false);
    toast.success('Transport removed', `${s.name} no longer uses school transport.`);
  };
  const cols: Column<Student>[] = [
    { key: 'name', header: 'Student', render: (s) => <div className="flex items-center gap-2"><Avatar src={s.photo} name={s.name} size={30} /><div><p className="font-medium">{s.name}</p><p className="text-xs text-navy-400">{className(s.classId)} – {s.section}</p></div></div>, value: (s) => s.name },
    { key: 'route', header: 'Route', value: (s) => routeOf(s.busRouteId)?.code ?? '', render: (s) => routeOf(s.busRouteId) ? <Badge tone="blue">{routeOf(s.busRouteId)!.code}</Badge> : <span className="text-navy-300">Not using transport</span> },
    { key: 'stop', header: 'Pick-up stop', value: (s) => routeOf(s.busRouteId)?.stops.find((x) => x.id === s.stopId)?.name ?? '', render: (s) => { const st = routeOf(s.busRouteId)?.stops.find((x) => x.id === s.stopId); return st ? <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-navy-400" />{st.name} · {st.time}</span> : '—'; } },
    { key: 'phone', header: 'Parent phone' },
  ];
  const selRoute = routeOf(rid);
  return (
    <>
      <DataTable rows={rows} columns={cols} loading={loading} searchPlaceholder="Search student…"
        toolbar={<>
          <Select className="w-52" value={fRoute} onChange={(e) => setFRoute(e.target.value)} options={[{ value: '', label: 'All bus users' }, ...routes.map((r) => ({ value: r.id, label: `${r.code} · ${r.name}` })), { value: 'none', label: 'Not using transport' }]} aria-label="Route filter" />
          <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => openAssign()}>Assign student</Button>
        </>}
        actions={(s) => <>
          <button className="btn-ghost btn-sm" onClick={() => openAssign(s)} aria-label="Change"><Pencil className="h-4 w-4" /></button>
          {s.busRouteId && <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => unassign(s)} aria-label="Unassign"><UserMinus className="h-4 w-4" /></button>}
        </>} />
      <Modal open={open} onClose={() => setOpen(false)} title="Assign transport" subtitle="Transport fee (₹9,600/yr demo) is applied automatically"
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={assign}>Assign</Button></>}>
        <div className="space-y-4">
          <Field label="Student"><SearchSelect value={sid} onChange={(val) => { setSid(val); const s = students.find((x) => x.id === val); if (s?.busRouteId) { setRid(s.busRouteId); setStop(s.stopId ?? ''); } }}
            options={students.filter((s) => s.status === 'Active').map((s) => ({ value: s.id, label: s.name, sub: `${className(s.classId)}-${s.section}${s.busRouteId ? ` · ${routeOf(s.busRouteId)?.code}` : ''}` }))} placeholder="Search student" /></Field>
          <Field label="Route"><Select value={rid} onChange={(e) => { setRid(e.target.value); setStop(''); }} placeholder="Select route" options={routes.map((r) => ({ value: r.id, label: `${r.code} · ${r.name}` }))} /></Field>
          <Field label="Pick-up stop"><SearchSelect value={stop} onChange={setStop} placeholder={selRoute ? 'Select stop' : 'Choose a route first'} options={(selRoute?.stops.slice(0, -1) ?? []).map((s) => ({ value: s.id, label: s.name, sub: s.time }))} /></Field>
          {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        </div>
      </Modal>
    </>
  );
}

type Tab = 'monitor' | 'buses' | 'drivers' | 'routes' | 'students';
export default function TransportManagement() {
  const [tab, setTab] = useState<Tab>('monitor');
  const { items: buses } = useCollection('buses');
  const { items: routes } = useCollection('routes');
  const { items: students } = useCollection('students');
  const { items: drivers } = useCollection('drivers');
  return (
    <div>
      <PageHeader eyebrow="Transport Management" title="School Transport" subtitle="Live fleet monitoring, buses, drivers, routes and student allocation"
        actions={<Badge tone="amber" dot>Simulated GPS data</Badge>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Buses active" value={`${buses.filter((b) => b.status === 'Active').length}/${buses.length}`} icon={<BusIcon className="h-5 w-5" />} />
        <StatCard label="Routes" value={routes.length} icon={<RouteIcon className="h-5 w-5" />} tone="blue" />
        <StatCard label="Students using transport" value={students.filter((s) => s.busRouteId).length} icon={<Users className="h-5 w-5" />} tone="gold" />
        <StatCard label="Drivers" value={drivers.length} icon={<Phone className="h-5 w-5" />} tone="green" />
      </div>
      <Tabs className="mb-5 w-fit max-w-full" value={tab} onChange={setTab} tabs={[
        { value: 'monitor', label: 'Live Monitor' }, { value: 'buses', label: 'Buses' }, { value: 'drivers', label: 'Drivers' }, { value: 'routes', label: 'Routes' }, { value: 'students', label: 'Student Assignment' },
      ]} />
      {tab === 'monitor' && <TransportMonitor />}
      {tab === 'buses' && <Buses />}
      {tab === 'drivers' && <Drivers />}
      {tab === 'routes' && <Routes />}
      {tab === 'students' && <StudentAssignment />}
    </div>
  );
}
