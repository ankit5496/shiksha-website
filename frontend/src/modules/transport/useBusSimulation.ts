import { useEffect, useMemo, useState } from 'react';
import type { Bus, BusRoute } from '@/types';

export type BusStatus = 'On Route' | 'Stopped' | 'Reached School';

export interface BusLive {
  busId: string;
  routeId: string;
  position: [number, number];
  /** degrees, 0 = north */
  heading: number;
  status: BusStatus;
  /** index into route.stops of the next stop the bus will reach (stops.length when finished) */
  nextStopIndex: number;
  /** index of the stop the bus is currently halted at (if Stopped) */
  atStopIndex: number | null;
  /** minutes to each stop index; null for stops already passed */
  etas: (number | null)[];
  speedKmh: number;
  lastUpdated: Date;
  /** 0..1 progress along the route */
  progress: number;
}

/**
 * Source of live bus locations. The demo uses `createSimulatedProvider`.
 *
 * To connect real GPS hardware, implement this interface against the backend, e.g.:
 *   - poll  GET /api/transport/live            → { [busId]: { lat, lng, heading, speed, ts } }
 *   - or subscribe to a WebSocket / SSE stream (devices POST to /api/transport/location)
 * then map each device fix onto the route (nearest path index) to derive next stop + ETAs
 * with the same `computeEtas` helper below.
 */
export interface LocationProvider {
  subscribe(cb: (snapshot: Record<string, BusLive>) => void): () => void;
}

const AVG_SPEED_KMH = 22;
const DWELL_TICKS = 4;
const END_PAUSE_TICKS = 10;
const TICK_MS = 1200;
/** densify() in the seed inserts 10 path points between consecutive stops */
const STEPS_PER_LEG = 10;

export function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function bearing(a: [number, number], b: [number, number]) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const y = Math.sin(toRad(b[1] - a[1])) * Math.cos(toRad(b[0]));
  const x = Math.cos(toRad(a[0])) * Math.sin(toRad(b[0])) - Math.sin(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.cos(toRad(b[1] - a[1]));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const stopPathIndex = (route: BusRoute, stopIdx: number) => Math.min(stopIdx * STEPS_PER_LEG, route.path.length - 1);

/** Minutes from path index `idx` to every stop (null if already passed). */
export function computeEtas(route: BusRoute, idx: number, speed = AVG_SPEED_KMH): (number | null)[] {
  return route.stops.map((_, si) => {
    const target = stopPathIndex(route, si);
    if (target < idx) return null;
    let km = 0;
    for (let i = idx; i < target; i++) km += haversineKm(route.path[i], route.path[i + 1]);
    const intermediateStops = route.stops.filter((__, k) => { const p = stopPathIndex(route, k); return p > idx && p < target; }).length;
    return Math.max(0, Math.round((km / speed) * 60 + intermediateStops * 0.5));
  });
}

interface SimState { idx: number; dwell: number; pause: number; speed: number }

export function createSimulatedProvider(routes: BusRoute[], buses: Bus[]): LocationProvider {
  const state = new Map<string, SimState>();
  buses.forEach((b, i) => {
    const route = routes.find((r) => r.id === b.routeId);
    if (!route) return;
    // stagger buses so they are at different points of their trips
    state.set(b.id, { idx: Math.floor(route.path.length * [0.28, 0.55, 0.12, 0.75][i % 4]), dwell: 0, pause: 0, speed: AVG_SPEED_KMH });
  });

  const snapshot = (): Record<string, BusLive> => {
    const out: Record<string, BusLive> = {};
    buses.forEach((b) => {
      const route = routes.find((r) => r.id === b.routeId);
      const s = state.get(b.id);
      if (!route || !s || b.status !== 'Active') return;
      const last = route.path.length - 1;
      const idx = Math.min(s.idx, last);
      const pos = route.path[idx];
      const nextPt = route.path[Math.min(idx + 1, last)];
      const prevPt = route.path[Math.max(idx - 1, 0)];
      const finished = idx >= last;
      const atStop = idx % STEPS_PER_LEG === 0 && s.dwell > 0 ? idx / STEPS_PER_LEG : null;
      const nextStopIndex = finished ? route.stops.length : Math.min(route.stops.length - 1, Math.floor(idx / STEPS_PER_LEG) + (idx % STEPS_PER_LEG === 0 && s.dwell === 0 ? 0 : 1));
      const status: BusStatus = finished ? 'Reached School' : atStop !== null || s.idx === 0 ? 'Stopped' : 'On Route';
      out[b.id] = {
        busId: b.id, routeId: route.id, position: pos,
        heading: bearing(finished ? prevPt : pos, finished ? pos : nextPt),
        status, nextStopIndex: atStop !== null ? atStop : nextStopIndex, atStopIndex: atStop,
        etas: computeEtas(route, idx),
        speedKmh: status === 'On Route' ? Math.round(s.speed) : 0,
        lastUpdated: new Date(), progress: idx / last,
      };
    });
    return out;
  };

  const tick = () => {
    buses.forEach((b) => {
      const route = routes.find((r) => r.id === b.routeId);
      const s = state.get(b.id);
      if (!route || !s) return;
      const last = route.path.length - 1;
      if (s.idx >= last) {
        s.pause++;
        if (s.pause > END_PAUSE_TICKS) { s.idx = 0; s.pause = 0; s.dwell = DWELL_TICKS; }
        return;
      }
      if (s.dwell > 0) { s.dwell--; if (s.dwell === 0) s.idx++; return; }
      s.idx++;
      s.speed = AVG_SPEED_KMH - 4 + Math.random() * 10;
      if (s.idx % STEPS_PER_LEG === 0 && s.idx < last) s.dwell = DWELL_TICKS;
    });
  };

  return {
    subscribe(cb) {
      cb(snapshot());
      const t = setInterval(() => { tick(); cb(snapshot()); }, TICK_MS);
      return () => clearInterval(t);
    },
  };
}

/** Live positions for all active buses. Re-creates the provider only when the set of routes/buses changes. */
export function useBusSimulation(routes: BusRoute[], buses: Bus[]) {
  const [live, setLive] = useState<Record<string, BusLive>>({});
  const key = useMemo(() => `${routes.map((r) => r.id + r.path.length).join(',')}|${buses.map((b) => b.id + b.routeId + b.status).join(',')}`, [routes, buses]);
  useEffect(() => {
    if (!routes.length || !buses.length) return;
    const provider = createSimulatedProvider(routes, buses);
    return provider.subscribe(setLive);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return live;
}

export const fmtEta = (m: number | null | undefined) => (m === null || m === undefined ? '—' : m <= 0 ? 'Arriving' : m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`);
