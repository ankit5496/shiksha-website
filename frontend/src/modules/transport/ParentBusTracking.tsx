import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bus as BusIcon, Clock, Gauge, Phone, Radio, School, ShieldCheck, UserRound, Users } from 'lucide-react';
import { Avatar, Badge, Button, EmptyState, PageHeader, Panel, ProgressBar, Spinner, StatusBadge, Tabs } from '@/components/ui';
import { useStudentContext } from '@/hooks/useStudentContext';
import { onDataChange } from '@/services/dataService';
import { transportService, type ParentBusTrackingData } from '@/services/transportService';
import BusMap from './BusMap';
import { StopTimeline } from './StopTimeline';
import { fmtEta, useBusSimulation } from './useBusSimulation';

const TRANSPORT_COLLECTIONS = new Set(['students', 'buses', 'routes', 'drivers', 'users']);
const firstName = (n: string) => n.split(' ')[0];

/**
 * Parent-facing tracking screen. Shows ONLY the buses assigned to the signed-in parent's children,
 * as returned by GET /api/parent/bus-tracking (authorised on the server from the parent's token).
 */
export default function ParentBusTracking() {
  const { student: activeStudent, setActiveStudentId } = useStudentContext();
  const [data, setData] = useState<ParentBusTrackingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    transportService.getParentBusTracking()
      .then((d) => { setData(d); setError(null); })
      .catch((e: Error) => setError(e.message || 'Could not load bus details.'));
  }, []);
  useEffect(() => {
    load();
    return onDataChange((c) => { if (TRANSPORT_COLLECTIONS.has(c)) load(); });
  }, [load]);

  // only the authorised buses/routes are handed to the simulation and the map
  const buses = useMemo(() => data?.buses.map((b) => b.bus) ?? [], [data]);
  const routes = useMemo(() => data?.buses.flatMap((b) => (b.route ? [b.route] : [])) ?? [], [data]);
  const live = useBusSimulation(routes, buses);

  if (error) {
    return (
      <div>
        <PageHeader eyebrow="Transport" title="Live Bus Tracking" />
        <Panel><EmptyState icon={<AlertTriangle className="h-6 w-6" />} title="Bus details are unavailable" message={error} action={<Button variant="outline" onClick={load}>Try again</Button>} /></Panel>
      </div>
    );
  }
  if (!data) return <Spinner />;

  const children = data.children;
  const child = children.find((c) => c.studentId === activeStudent?.id) ?? children[0];
  const assigned = child?.busId ? data.buses.find((b) => b.bus.id === child.busId) : undefined;
  const distinctBuses = new Set(children.map((c) => c.busId ?? `none-${c.studentId}`)).size;
  const showSelector = children.length > 1 && distinctBuses > 1;

  return (
    <div>
      <PageHeader eyebrow="Transport" title="Live Bus Tracking"
        subtitle={child ? `Track ${firstName(child.name)}'s school bus in real time.` : 'Track your child\'s school bus in real time.'} />
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-dashed border-gold-300 bg-gold-50/70 px-4 py-3 text-sm text-gold-900">
        <Radio className="mt-0.5 h-4 w-4 shrink-0" />
        <p><strong>Demonstration mode:</strong> bus positions are generated from simulated GPS coordinates along predefined routes. The system is ready to connect to real GPS devices.</p>
      </div>

      {showSelector && child && (
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Tabs className="w-full sm:w-auto" value={child.studentId} onChange={setActiveStudentId}
            tabs={children.map((c) => ({ value: c.studentId, label: `${firstName(c.name)} · ${data.buses.find((b) => b.bus.id === c.busId)?.bus.number ?? 'No bus'}` }))} />
          <p className="text-xs text-navy-400">Your children have different transport arrangements – select a child to see their school bus.</p>
        </div>
      )}

      {!child ? (
        <Panel><EmptyState icon={<Users className="h-6 w-6" />} title="No student linked" message="No student is linked to your account. Please contact the school office." /></Panel>
      ) : !assigned || !assigned.route ? (
        <Panel>
          <EmptyState icon={<BusIcon className="h-6 w-6" />} title="No school bus has been assigned to your child yet."
            message={`${child.name} is not assigned to a school bus. Please contact the school transport office for further assistance.`} />
        </Panel>
      ) : (
        <AssignedBusView data={data} assigned={assigned} child={child} live={live[assigned.bus.id]} liveAll={live} />
      )}
    </div>
  );
}

type Assigned = ParentBusTrackingData['buses'][number];
type Child = ParentBusTrackingData['children'][number];

function AssignedBusView({ data, assigned, child, live: l, liveAll }: {
  data: ParentBusTrackingData; assigned: Assigned; child: Child;
  live: ReturnType<typeof useBusSimulation>[string] | undefined; liveAll: ReturnType<typeof useBusSimulation>;
}) {
  const { bus, driver } = assigned;
  const route = assigned.route!;
  const myStopIdx = route.stops.findIndex((s) => s.id === child.stopId);
  const myStop = route.stops[myStopIdx];
  const riders = data.children.filter((c) => assigned.studentIds.includes(c.studentId));

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <div className="space-y-5">
        <BusMap routes={[route]} buses={[bus]} live={liveAll} highlightRouteId={route.id} focusStopId={child.stopId ?? undefined} height="min(64vh, 620px)" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">ETA to {myStop?.name ?? 'your stop'}</p>
            <p className="mt-1.5 font-serif text-2xl font-semibold text-navy-900">{myStopIdx >= 0 && l?.etas[myStopIdx] !== null ? fmtEta(l?.etas[myStopIdx]) : 'Passed'}</p>
            <p className="text-xs text-navy-400">Scheduled {myStop?.time ?? '—'}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">ETA to school</p>
            <p className="mt-1.5 font-serif text-2xl font-semibold text-navy-900">{l?.status === 'Reached School' ? 'Reached' : fmtEta(l?.etas[route.stops.length - 1])}</p>
            <p className="text-xs text-navy-400">Scheduled {route.stops[route.stops.length - 1].time}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">Trip progress</p>
            <p className="mt-1.5 font-serif text-2xl font-semibold text-navy-900">{Math.round((l?.progress ?? 0) * 100)}%</p>
            <ProgressBar value={(l?.progress ?? 0) * 100} tone="gold" className="mt-2" />
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <Panel title={<span className="flex items-center gap-2"><BusIcon className="h-4 w-4 text-gold-600" />{bus.number} · {route.code}</span>} action={l && <StatusBadge status={l.status} />}>
          <p className="text-sm font-medium text-navy-800">{route.name}</p>
          {riders.length > 1 && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-navy-500"><Users className="h-3.5 w-3.5 text-gold-600" />Carries {riders.map((r) => firstName(r.name)).join(' & ')}</p>
          )}
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-xs text-navy-400">Registration</dt><dd className="font-medium text-navy-800">{bus.registration}</dd></div>
            <div><dt className="text-xs text-navy-400">Capacity</dt><dd className="font-medium text-navy-800">{bus.capacity} seats</dd></div>
            <div><dt className="flex items-center gap-1 text-xs text-navy-400"><Gauge className="h-3 w-3" />Speed</dt><dd className="font-medium text-navy-800">{l ? `${l.speedKmh} km/h` : '—'}</dd></div>
            <div><dt className="flex items-center gap-1 text-xs text-navy-400"><Clock className="h-3 w-3" />Last updated</dt><dd className="font-medium text-navy-800">{l ? l.lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}</dd></div>
          </dl>
          <div className="mt-5 space-y-3 border-t border-navy-50 pt-4">
            {driver && (
              <div className="flex items-center gap-3">
                <Avatar src={driver.photo} name={driver.name} size={42} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-navy-900">{driver.name}</p>
                  <p className="text-xs text-navy-400">Driver · {driver.experienceYears} yrs experience</p>
                </div>
                <a href={`tel:${driver.phone.replace(/\s/g, '')}`} className="btn-outline btn-sm"><Phone className="h-3.5 w-3.5" />Call</a>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-mist text-navy-500"><UserRound className="h-5 w-5" /></div>
              <div><p className="text-sm font-semibold text-navy-900">{bus.attendantName}</p><p className="text-xs text-navy-400">Bus attendant</p></div>
              <Badge tone="green" className="ml-auto"><ShieldCheck className="h-3 w-3" />Verified</Badge>
            </div>
          </div>
        </Panel>
        <Panel title="Route & stops" subtitle="Morning pick-up trip" action={<School className="h-4 w-4 text-navy-300" />}>
          <StopTimeline route={route} live={l} myStopId={child.stopId ?? undefined} />
        </Panel>
      </div>
    </div>
  );
}
