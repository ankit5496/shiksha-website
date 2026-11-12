import { useState } from 'react';
import clsx from 'clsx';
import { Bus as BusIcon, MapPin, Users } from 'lucide-react';
import { Badge, EmptyState, Panel, ProgressBar, Spinner, StatusBadge } from '@/components/ui';
import { useCollection } from '@/hooks/useCollection';
import BusMap from './BusMap';
import { StopTimeline } from './StopTimeline';
import { fmtEta, useBusSimulation } from './useBusSimulation';

/** Fleet-wide live monitor used on the Admin / Office Transport page. */
export default function TransportMonitor() {
  const { items: routes, loading: rl } = useCollection('routes');
  const { items: buses, loading: bl } = useCollection('buses');
  const { items: drivers } = useCollection('drivers');
  const { items: students } = useCollection('students');
  const live = useBusSimulation(routes, buses);
  const [selected, setSelected] = useState<string | null>(null);

  if (rl || bl) return <Spinner />;
  if (!buses.length) return <Panel><EmptyState icon={<BusIcon className="h-6 w-6" />} title="No buses configured" message="Add buses and routes to start monitoring." /></Panel>;

  const selBus = buses.find((b) => b.id === selected);
  const selRoute = routes.find((r) => r.id === selBus?.routeId);
  const counts = { route: 0, stopped: 0, reached: 0 };
  Object.values(live).forEach((l) => { if (l.status === 'On Route') counts.route++; else if (l.status === 'Stopped') counts.stopped++; else counts.reached++; });

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge tone="blue" dot>On route: {counts.route}</Badge>
          <Badge tone="amber" dot>Stopped: {counts.stopped}</Badge>
          <Badge tone="green" dot>Reached school: {counts.reached}</Badge>
          {selected && <button className="btn-ghost btn-sm" onClick={() => setSelected(null)}>Show all routes</button>}
        </div>
        <BusMap routes={routes} buses={buses} live={live} highlightRouteId={selBus?.routeId} onBusClick={(id) => setSelected(id)} height="min(66vh, 640px)" />
      </div>
      <div className="space-y-3">
        {buses.map((b) => {
          const l = live[b.id];
          const r = routes.find((x) => x.id === b.routeId);
          const d = drivers.find((x) => x.id === b.driverId);
          const riders = students.filter((s) => s.busRouteId === b.routeId).length;
          const next = r && l && l.nextStopIndex < r.stops.length ? r.stops[l.nextStopIndex] : undefined;
          return (
            <button key={b.id} onClick={() => setSelected(selected === b.id ? null : b.id)}
              className={clsx('card w-full p-4 text-left transition hover:shadow-lift', selected === b.id && 'ring-2 ring-gold-400')}>
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 font-semibold text-navy-900"><BusIcon className="h-4 w-4 text-gold-600" />{b.number} <span className="text-xs font-normal text-navy-400">{r?.code}</span></p>
                {b.status === 'Maintenance' ? <StatusBadge status="Maintenance" /> : l ? <StatusBadge status={l.status} /> : null}
              </div>
              <p className="mt-1 truncate text-xs text-navy-500">{r?.name} · {d?.name ?? 'No driver'}</p>
              {l && r && (
                <>
                  <div className="mt-3 flex items-center justify-between text-xs text-navy-500">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{l.status === 'Reached School' ? 'At school' : `Next: ${next?.name ?? '—'}`}</span>
                    <span className="font-semibold text-navy-800">{l.status === 'Reached School' ? '' : fmtEta(l.etas[l.nextStopIndex])}</span>
                  </div>
                  <ProgressBar value={l.progress * 100} tone={selected === b.id ? 'gold' : 'navy'} className="mt-2" />
                </>
              )}
              <p className="mt-2 flex items-center gap-1 text-[11px] text-navy-400"><Users className="h-3 w-3" />{riders} students assigned · {b.capacity} seats</p>
            </button>
          );
        })}
        {selRoute && selBus && (
          <Panel title={`${selBus.number} – stops`} subtitle={selRoute.name}>
            <StopTimeline route={selRoute} live={live[selBus.id]} />
          </Panel>
        )}
      </div>
    </div>
  );
}
