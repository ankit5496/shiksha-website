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
  return buses.map((bus) => ({ bus, location: locationFor(bus, routes.find((r) => r.id === bus.routeId)) }));
}

/** Latest position for one bus: a fresh GPS fix if a device has reported, otherwise the simulation. */
export function locationFor(bus, route) {
  const gps = live.get(bus.id);
  const fresh = gps && Date.now() - new Date(gps.updatedAt).getTime() < 2 * 60 * 1000;
  return fresh ? gps : simulate(bus, route);
}

/**
 * Resolves the transport records a set of students is entitled to see:
 *   Student → bus assignment (student.busRouteId + stopId) → Bus (bus.routeId) → Route → Driver
 * Returns id sets for scoping plus the resolved rows.
 */
export async function transportAccess(studentIds) {
  const students = studentIds.length ? await repo('students').list({ id: studentIds }) : [];
  const routeIds = new Set(students.map((s) => s.busRouteId).filter(Boolean));
  const [buses, routes] = await Promise.all([repo('buses').list(), repo('routes').list()]);
  const myBuses = buses.filter((b) => routeIds.has(b.routeId));
  const myRoutes = routes.filter((r) => routeIds.has(r.id));
  return {
    students,
    buses: myBuses,
    routes: myRoutes,
    busIds: new Set(myBuses.map((b) => b.id)),
    routeIds: new Set(myRoutes.map((r) => r.id)),
    driverIds: new Set(myBuses.map((b) => b.driverId).filter(Boolean)),
  };
}

/**
 * Payload for GET /api/parent/bus-tracking. Only buses assigned to the given students are included;
 * a bus shared by several children appears once, listing every child it carries.
 */
export async function busTrackingFor(studentIds) {
  const { students, buses, routes } = await transportAccess(studentIds);
  const drivers = await repo('drivers').list({ id: [...new Set(buses.map((b) => b.driverId))] });
  const children = students.map((s) => {
    const bus = buses.find((b) => b.routeId === s.busRouteId) || null;
    return { studentId: s.id, name: s.name, classId: s.classId, section: s.section, stopId: s.stopId || null, busId: bus?.id || null };
  });
  const rows = buses.map((bus) => {
    const route = routes.find((r) => r.id === bus.routeId) || null;
    const d = drivers.find((x) => x.id === bus.driverId);
    return {
      bus,
      route,
      // parents get contact details, not licence data
      driver: d ? { id: d.id, name: d.name, phone: d.phone, photo: d.photo, experienceYears: d.experienceYears } : null,
      location: route ? locationFor(bus, route) : null,
      studentIds: children.filter((c) => c.busId === bus.id).map((c) => c.studentId),
    };
  });
  return { updatedAt: new Date().toISOString(), simulated: true, children, buses: rows };
}
