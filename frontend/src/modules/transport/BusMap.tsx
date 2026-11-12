import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Radio } from 'lucide-react';
import type { Bus, BusRoute } from '@/types';
import { GOOGLE_MAPS_KEY } from '@/services/config';
import type { BusLive } from './useBusSimulation';

export interface BusMapProps {
  routes: BusRoute[];
  buses: Bus[];
  live: Record<string, BusLive>;
  highlightRouteId?: string;
  focusStopId?: string;
  height?: number | string;
  onBusClick?: (busId: string) => void;
}

const NAVY = '#1F3B6C';
const GOLD = '#C29234';

function busIcon(label: string, highlighted: boolean, status: string) {
  const bg = highlighted ? GOLD : '#0B1A33';
  const dot = status === 'On Route' ? '#10B981' : status === 'Stopped' ? '#F59E0B' : '#38BDF8';
  return L.divIcon({
    className: 'sps-bus-marker',
    iconSize: [86, 30],
    iconAnchor: [43, 15],
    html: `<div style="display:flex;align-items:center;gap:6px;background:${bg};color:#fff;border:2px solid #fff;border-radius:999px;padding:3px 10px 3px 4px;box-shadow:0 6px 16px rgba(11,26,51,.35);font:600 11px Inter,sans-serif;white-space:nowrap;width:max-content">
      <span style="display:flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:999px;background:rgba(255,255,255,.15)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M8 6v6M16 6v6M2 12h20M7 18v2M17 18v2"/><rect x="4" y="3" width="16" height="15" rx="3"/></svg>
      </span>${label}<span style="width:7px;height:7px;border-radius:99px;background:${dot}"></span></div>`,
  });
}

const schoolIcon = L.divIcon({
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  html: `<div style="width:34px;height:34px;border-radius:12px;background:#C29234;border:3px solid #fff;box-shadow:0 6px 16px rgba(11,26,51,.35);display:flex;align-items:center;justify-content:center">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B1A33" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg></div>`,
});

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  const key = points.length ? `${points[0]}|${points[points.length - 1]}|${points.length}` : '';
  useEffect(() => {
    if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [36, 36] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

function SimChip() {
  return (
    <div className="pointer-events-none absolute left-3 top-3 z-[500] flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-navy-800 shadow-soft ring-1 ring-navy-100">
      <Radio className="h-3.5 w-3.5 animate-pulse text-gold-600" /> Simulated GPS data
    </div>
  );
}

function LeafletBusMap({ routes, buses, live, highlightRouteId, focusStopId, onBusClick }: BusMapProps) {
  // draw the highlighted route last so it sits on top
  const visibleRoutes = highlightRouteId ? [...routes.filter((r) => r.id !== highlightRouteId), ...routes.filter((r) => r.id === highlightRouteId)] : routes;
  const fitPoints = useMemo(() => {
    const r = routes.find((x) => x.id === highlightRouteId);
    return r ? r.path : routes.flatMap((x) => x.path);
  }, [routes, highlightRouteId]);
  const school = routes[0]?.stops[routes[0].stops.length - 1];
  const center: [number, number] = school ? [school.lat, school.lng] : [26.1018, 74.3205];

  return (
    <MapContainer center={center} zoom={14} scrollWheelZoom className="h-full w-full" attributionControl>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitBounds points={fitPoints} />
      {visibleRoutes.map((r) => {
        const hl = r.id === highlightRouteId;
        const dim = !!highlightRouteId && !hl;
        return (
          <Polyline key={r.id} positions={r.path} pathOptions={{ color: hl ? GOLD : NAVY, weight: hl ? 6 : 4, opacity: dim ? 0.25 : 0.85, lineCap: 'round' }} />
        );
      })}
      {visibleRoutes.flatMap((r) =>
        r.stops.slice(0, -1).map((s) => {
          const focus = s.id === focusStopId;
          const dim = !!highlightRouteId && r.id !== highlightRouteId;
          return (
            <CircleMarker key={s.id} center={[s.lat, s.lng]} radius={focus ? 9 : 6}
              pathOptions={{ color: focus ? GOLD : NAVY, weight: focus ? 4 : 2, fillColor: '#fff', fillOpacity: 1, opacity: dim ? 0.3 : 1 }}>
              <Tooltip direction="top" offset={[0, -6]}>{s.name} · {s.time}{focus ? ' (your stop)' : ''}</Tooltip>
            </CircleMarker>
          );
        }),
      )}
      {school && <Marker position={[school.lat, school.lng]} icon={schoolIcon}><Tooltip direction="top" offset={[0, -14]}>School Campus (approximate demo location)</Tooltip></Marker>}
      {buses.map((b) => {
        const l = live[b.id];
        if (!l) return null;
        return (
          <Marker key={b.id} position={l.position} icon={busIcon(b.number, b.routeId === highlightRouteId, l.status)} zIndexOffset={1000}
            eventHandlers={{ click: () => onBusClick?.(b.id) }} />
        );
      })}
    </MapContainer>
  );
}

// ---------------- Google Maps variant (used when VITE_GOOGLE_MAPS_API_KEY is set) ----------------
/* eslint-disable @typescript-eslint/no-explicit-any */
declare global { interface Window { google?: any; __spsGmapsLoading?: Promise<void> } }

function loadGoogleMaps(key: string) {
  if (window.google?.maps) return Promise.resolve();
  if (!window.__spsGmapsLoading) {
    window.__spsGmapsLoading = new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}`;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Google Maps failed to load'));
      document.head.appendChild(s);
    });
  }
  return window.__spsGmapsLoading;
}

function GoogleBusMap({ routes, buses, live, highlightRouteId, focusStopId, onBusClick }: BusMapProps) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const overlays = useRef<any[]>([]);
  const busMarkers = useRef<Record<string, any>>({});
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    loadGoogleMaps(GOOGLE_MAPS_KEY).then(() => setReady(true)).catch(() => setFailed(true));
  }, []);

  // static layers: routes, stops, school
  useEffect(() => {
    if (!ready || !el.current) return;
    const g = window.google.maps;
    if (!map.current) map.current = new g.Map(el.current, { center: { lat: 26.1018, lng: 74.3205 }, zoom: 14, disableDefaultUI: false, mapTypeControl: false, streetViewControl: false });
    overlays.current.forEach((o) => o.setMap(null));
    overlays.current = [];
    const bounds = new g.LatLngBounds();
    routes.forEach((r) => {
      const hl = r.id === highlightRouteId;
      const dim = !!highlightRouteId && !hl;
      overlays.current.push(new g.Polyline({ map: map.current, path: r.path.map(([lat, lng]) => ({ lat, lng })), strokeColor: hl ? GOLD : NAVY, strokeWeight: hl ? 6 : 4, strokeOpacity: dim ? 0.25 : 0.85, zIndex: hl ? 2 : 1 }));
      if (!highlightRouteId || hl) r.path.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
      r.stops.forEach((s, i) => {
        const isSchool = i === r.stops.length - 1;
        const focus = s.id === focusStopId;
        overlays.current.push(new g.Marker({
          map: map.current, position: { lat: s.lat, lng: s.lng }, title: `${s.name} · ${s.time}`,
          icon: { path: g.SymbolPath.CIRCLE, scale: isSchool ? 10 : focus ? 8 : 5, fillColor: isSchool ? GOLD : '#fff', fillOpacity: 1, strokeColor: focus ? GOLD : NAVY, strokeWeight: focus ? 4 : 2 },
          opacity: dim ? 0.35 : 1,
        }));
      });
    });
    map.current.fitBounds(bounds, 40);
  }, [ready, routes, highlightRouteId, focusStopId]);

  // moving bus markers
  useEffect(() => {
    if (!ready || !map.current) return;
    const g = window.google.maps;
    buses.forEach((b) => {
      const l = live[b.id];
      if (!l) return;
      const pos = { lat: l.position[0], lng: l.position[1] };
      const hl = b.routeId === highlightRouteId;
      let m = busMarkers.current[b.id];
      if (!m) {
        m = new g.Marker({ map: map.current, position: pos, zIndex: 10 });
        m.addListener('click', () => onBusClick?.(b.id));
        busMarkers.current[b.id] = m;
      }
      m.setPosition(pos);
      m.setLabel({ text: b.number, color: '#fff', fontSize: '11px', fontWeight: '600' });
      m.setIcon({ path: 'M -26 -11 L 26 -11 Q 30 -11 30 -7 L 30 7 Q 30 11 26 11 L -26 11 Q -30 11 -30 7 L -30 -7 Q -30 -11 -26 -11 Z', fillColor: hl ? GOLD : '#0B1A33', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2, scale: 1, labelOrigin: new g.Point(0, 0) });
    });
  }, [ready, live, buses, highlightRouteId, onBusClick]);

  if (failed) return <LeafletBusMap routes={routes} buses={buses} live={live} highlightRouteId={highlightRouteId} focusStopId={focusStopId} onBusClick={onBusClick} />;
  return <div ref={el} className="h-full w-full bg-mist" />;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function BusMap(props: BusMapProps) {
  const { height = 520 } = props;
  return (
    <div className="relative isolate overflow-hidden rounded-2xl border border-navy-100 bg-mist" style={{ height }}>
      <style>{`.sps-bus-marker{transition:transform 1.1s linear}.leaflet-zoom-anim .sps-bus-marker{transition:none}`}</style>
      {GOOGLE_MAPS_KEY ? <GoogleBusMap {...props} /> : <LeafletBusMap {...props} />}
      <SimChip />
    </div>
  );
}
