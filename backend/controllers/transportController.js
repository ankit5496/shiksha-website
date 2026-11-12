import crypto from 'node:crypto';
import { asyncHandler, badRequest, unauthorized } from '../utils/httpError.js';
import { env } from '../config/env.js';
import { repo } from '../services/repository.js';
import { ingestLocation, liveLocations } from '../services/transportService.js';
import { allowedStudentIds } from '../middleware/scope.js';

/** GET /api/transport/live – latest position of every bus (parents only see their child's bus). */
export const live = asyncHandler(async (req, res) => {
  let rows = await liveLocations();
  const ids = allowedStudentIds(req.user);
  if (ids) {
    const students = await repo('students').list({ id: ids });
    const routeIds = new Set(students.map((s) => s.busRouteId).filter(Boolean));
    rows = rows.filter((r) => routeIds.has(r.bus.routeId));
  }
  res.json({ updatedAt: new Date().toISOString(), buses: rows });
});

/**
 * POST /api/transport/location – called by GPS hardware / driver app.
 * Header: x-device-key: <GPS_DEVICE_KEY>
 * Body:   { busId, lat, lng, speed?, heading? }
 */
export const ingest = asyncHandler(async (req, res) => {
  const key = Buffer.from(String(req.headers['x-device-key'] || ''));
  const expected = Buffer.from(env.gpsDeviceKey);
  if (key.length !== expected.length || !crypto.timingSafeEqual(key, expected)) throw unauthorized('Invalid device key.');
  const { busId, lat, lng, speed, heading } = req.body || {};
  if (!busId || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) throw badRequest('busId, lat and lng are required.');
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) throw badRequest('Coordinates out of range.');
  const bus = await repo('buses').get(busId);
  if (!bus) throw badRequest('Unknown busId.');
  res.status(202).json(ingestLocation({ busId, lat, lng, speed, heading }));
});
