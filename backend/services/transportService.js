/**
 * Latest known bus positions (in memory). In production, persist a location history
 * (e.g. a Mongo time-series collection) and push updates over WebSockets / SSE.
 *
 * Sources:
 *  - real GPS devices → POST /api/transport/location (x-device-key header)
 *  - demo simulator   → positions are interpolated along each route's path until a device reports
 */
import { repo } from './repository.js';

const live = new Map(); // busId → { busId, lat, lng, speed, heading, updatedAt, source }

export function ingestLocation({ busId, lat, lng, speed = 0, heading = 0 }) {
  const rec = { busId, lat: Number(lat), lng: Number(lng), speed: Number(speed), heading: Number(heading), updatedAt: new Date().toISOString(), source: 'gps' };
  live.set(busId, rec);
  return rec;
}

/** Simulated position: loops along the route path every ~6 minutes. */
function simulate(bus, route) {
  const path = route?.path || [];
  if (!path.length) return null;
  const cycleMs = 6 * 60 * 1000;
  const offset = (parseInt(bus.id.replace(/\D/g, ''), 10) || 0) * 37000;
  const t = ((Date.now() + offset) % cycleMs) / cycleMs;
  const idx = Math.min(path.length - 1, Math.floor(t * path.length));
  const [lat, lng] = path[idx];
  return { busId: bus.id, lat, lng, speed: idx === path.length - 1 ? 0 : 24, heading: 0, updatedAt: new Date().toISOString(), source: 'simulated', progress: idx / (path.length - 1) };
}

export async function liveLocations() {
  const [buses, routes] = await Promise.all([repo('buses').list(), repo('routes').list()]);
  return buses.map((bus) => {
    const gps = live.get(bus.id);
    const fresh = gps && Date.now() - new Date(gps.updatedAt).getTime() < 2 * 60 * 1000;
    return { bus, location: fresh ? gps : simulate(bus, routes.find((r) => r.id === bus.routeId)) };
  });
}
