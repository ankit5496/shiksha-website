import { Bus as BusIcon, Clock, Gauge, Phone, Radio, School, ShieldCheck, UserRound } from 'lucide-react';
import { Avatar, Badge, EmptyState, PageHeader, Panel, ProgressBar, Spinner, StatusBadge } from '@/components/ui';
import { useCollection } from '@/hooks/useCollection';
import { useStudentContext } from '@/hooks/useStudentContext';
import BusMap from './BusMap';
import { StopTimeline } from './StopTimeline';
import { fmtEta, useBusSimulation } from './useBusSimulation';

export default function ParentBusTracking() {
  const { student, loading } = useStudentContext();
  const { items: routes, loading: rl } = useCollection('routes');
  const { items: buses, loading: bl } = useCollection('buses');
  const { items: drivers } = useCollection('drivers');
  const live = useBusSimulation(routes, buses);

  if (loading || rl || bl) return <Spinner />;
  if (!student) return <EmptyState title="No student linked" />;

  const route = routes.find((r) => r.id === student.busRouteId);
  const bus = buses.find((b) => b.routeId === route?.id);
  const driver = drivers.find((d) => d.id === bus?.driverId);
  const l = bus ? live[bus.id] : undefined;
  const myStopIdx = route?.stops.findIndex((s) => s.id === student.stopId) ?? -1;
  const myStop = route?.stops[myStopIdx];

  return (
    <div>
      <PageHeader eyebrow="Transport" title="Live Bus Tracking" subtitle={`Track ${student.name.split(' ')[0]}'s school bus in real time.`} />
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-dashed border-gold-300 bg-gold-50/70 px-4 py-3 text-sm text-gold-900">
        <Radio className="mt-0.5 h-4 w-4 shrink-0" />
        <p><strong>Demonstration mode:</strong> bus positions are generated from simulated GPS coordinates along predefined routes. The system is ready to connect to real GPS devices.</p>
      </div>

      {!route || !bus ? (
        <Panel><EmptyState icon={<BusIcon className="h-6 w-6" />} title="School transport not opted" message={`${student.name} is not assigned to a school bus route. Contact the school office to opt for transport.`} /></Panel>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <div className="space-y-5">
            <BusMap routes={routes} buses={buses} live={live} highlightRouteId={route.id} focusStopId={student.stopId} height="min(64vh, 620px)" />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">ETA to {myStop?.name ?? 'your stop'}</p>
                <p className="mt-1.5 font-serif text-2xl font-semibold text-navy-900">{myStopIdx >= 0 && l?.etas[myStopIdx] !== null ? fmtEta(l?.etas[myStopIdx]) : 'Passed'}</p>
                <p className="text-xs text-navy-400">Scheduled {myStop?.time}</p>
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
              <StopTimeline route={route} live={l} myStopId={student.stopId} />
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
