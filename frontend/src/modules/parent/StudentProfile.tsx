import type { ReactNode } from 'react';
import { Bus, Calendar, Droplet, Hash, Mail, MapPin, Phone, User, Users } from 'lucide-react';
import { Avatar, Badge, EmptyState, PageHeader, Panel, Spinner, StatusBadge } from '@/components/ui';
import { useCollection } from '@/hooks/useCollection';
import { useStudentContext } from '@/hooks/useStudentContext';
import { fmtDate } from '@/utils/format';

function Row({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 text-navy-300">{icon}</span>
      <div className="min-w-0"><dt className="text-xs text-navy-400">{label}</dt><dd className="text-sm font-medium text-navy-900">{value || '—'}</dd></div>
    </div>
  );
}

export default function StudentProfile() {
  const { student, className, classRoom, loading } = useStudentContext();
  const { items: teachers } = useCollection('teachers');
  const { items: routes } = useCollection('routes');
  const { items: buses } = useCollection('buses');
  if (loading) return <Spinner />;
  if (!student) return <EmptyState title="No student linked" />;
  const classTeacher = teachers.find((t) => t.id === classRoom?.classTeacherId);
  const route = routes.find((r) => r.id === student.busRouteId);
  const stop = route?.stops.find((s) => s.id === student.stopId);
  const bus = buses.find((b) => b.routeId === route?.id);
  const age = Math.floor((Date.now() - new Date(student.dob).getTime()) / (365.25 * 86400000));

  return (
    <div>
      <PageHeader eyebrow="Student" title="Student Profile" subtitle="Details as recorded with the school office. Contact the office to request corrections." />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="card overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-navy-900 to-navy-700" />
          <div className="-mt-12 flex flex-col items-center px-6 pb-6 text-center">
            <Avatar src={student.photo} name={student.name} size={96} className="ring-4" />
            <h2 className="mt-3 font-serif text-xl font-semibold text-navy-900">{student.name}</h2>
            <p className="text-sm text-navy-500">{className} – Section {student.section}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2"><StatusBadge status={student.status} /><Badge tone="gold">Roll No. {student.rollNo}</Badge></div>
            <dl className="mt-6 grid w-full grid-cols-2 gap-3 text-left">
              <div className="rounded-xl bg-mist p-3"><dt className="text-[11px] text-navy-400">Admission No.</dt><dd className="text-sm font-semibold text-navy-900">{student.admissionNo}</dd></div>
              <div className="rounded-xl bg-mist p-3"><dt className="text-[11px] text-navy-400">Admitted on</dt><dd className="text-sm font-semibold text-navy-900">{fmtDate(student.admissionDate)}</dd></div>
              <div className="col-span-2 rounded-xl bg-mist p-3"><dt className="text-[11px] text-navy-400">Class teacher</dt><dd className="text-sm font-semibold text-navy-900">{classTeacher?.name ?? 'To be assigned'}</dd></div>
            </dl>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Panel title="Personal details">
            <dl className="divide-y divide-navy-50">
              <Row icon={<User className="h-4 w-4" />} label="Full name" value={student.name} />
              <Row icon={<Calendar className="h-4 w-4" />} label="Date of birth" value={`${fmtDate(student.dob)} (${age} years)`} />
              <Row icon={<Users className="h-4 w-4" />} label="Gender" value={student.gender} />
              <Row icon={<Droplet className="h-4 w-4" />} label="Blood group" value={student.bloodGroup} />
            </dl>
          </Panel>
          <Panel title="Parents & contact">
            <dl className="divide-y divide-navy-50">
              <Row icon={<User className="h-4 w-4" />} label="Father's name" value={student.fatherName} />
              <Row icon={<User className="h-4 w-4" />} label="Mother's name" value={student.motherName} />
              <Row icon={<Phone className="h-4 w-4" />} label="Mobile" value={student.phone} />
              <Row icon={<Mail className="h-4 w-4" />} label="Email" value={student.email} />
              <Row icon={<MapPin className="h-4 w-4" />} label="Address" value={student.address} />
            </dl>
          </Panel>
          <Panel title="Academic" className="md:col-span-1">
            <dl className="divide-y divide-navy-50">
              <Row icon={<Hash className="h-4 w-4" />} label="Class & section" value={`${className} – ${student.section}`} />
              <Row icon={<Hash className="h-4 w-4" />} label="Roll number" value={student.rollNo} />
              <Row icon={<Calendar className="h-4 w-4" />} label="Stage" value={classRoom?.stage} />
            </dl>
          </Panel>
          <Panel title="Transport">
            {route ? (
              <dl className="divide-y divide-navy-50">
                <Row icon={<Bus className="h-4 w-4" />} label="Bus & route" value={`${bus?.number ?? '—'} · ${route.code} ${route.name}`} />
                <Row icon={<MapPin className="h-4 w-4" />} label="Pick-up stop" value={stop ? `${stop.name} (${stop.time})` : '—'} />
              </dl>
            ) : <p className="text-sm text-navy-500">Not using school transport.</p>}
          </Panel>
        </div>
      </div>
    </div>
  );
}
