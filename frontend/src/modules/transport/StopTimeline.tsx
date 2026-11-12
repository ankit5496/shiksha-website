import clsx from 'clsx';
import { Check, MapPin } from 'lucide-react';
import type { BusRoute } from '@/types';
import { fmtEta, type BusLive } from './useBusSimulation';

/** Vertical stop timeline with passed / current / upcoming states. */
export function StopTimeline({ route, live, myStopId }: { route: BusRoute; live?: BusLive; myStopId?: string }) {
  return (
    <ol className="relative">
      {route.stops.map((s, i) => {
        const passed = live ? live.status === 'Reached School' || i < live.nextStopIndex : false;
        const current = live && live.status !== 'Reached School' && i === live.nextStopIndex;
        const mine = s.id === myStopId;
        const isLast = i === route.stops.length - 1;
        return (
          <li key={s.id} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast && <span className={clsx('absolute left-[11px] top-6 h-[calc(100%-12px)] w-0.5', passed ? 'bg-navy-700' : 'bg-navy-100')} />}
            <span className={clsx('relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
              passed ? 'border-navy-700 bg-navy-700 text-white' : current ? 'border-gold-500 bg-gold-50' : 'border-navy-200 bg-white')}>
              {passed ? <Check className="h-3.5 w-3.5" /> : current ? <span className="h-2 w-2 animate-pulse rounded-full bg-gold-500" /> : null}
            </span>
            <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
              <div className="min-w-0">
                <p className={clsx('flex items-center gap-1.5 text-sm', current || mine ? 'font-semibold text-navy-900' : passed ? 'text-navy-400' : 'text-navy-700')}>
                  {s.name}
                  {mine && <span className="inline-flex items-center gap-0.5 rounded-full bg-gold-100 px-1.5 py-0.5 text-[10px] font-semibold text-gold-800"><MapPin className="h-3 w-3" />Your stop</span>}
                </p>
                <p className="text-xs text-navy-400">Scheduled {s.time}{current && live?.atStopIndex === i ? ' · Bus at stop' : current ? ' · Next stop' : ''}</p>
              </div>
              <span className={clsx('shrink-0 text-xs font-semibold', passed ? 'text-navy-300' : 'text-navy-700')}>{passed ? 'Passed' : fmtEta(live?.etas[i])}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
