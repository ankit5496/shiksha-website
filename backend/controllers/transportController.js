import crypto from 'node:crypto';
import { asyncHandler, badRequest, forbidden, unauthorized } from '../utils/httpError.js';
import { env } from '../config/env.js';
import { repo } from '../services/repository.js';
import { busTrackingFor, ingestLocation, liveLocations, transportAccess } from '../services/transportService.js';
import { linkedStudentIds } from '../middleware/scope.js';

/** GET /api/transport/live – latest position of every bus (parents/students only see their assigned bus). */
export const live = asyncHandler(async (req, res) => {
  let rows = await liveLocations();
  const ids = await linkedStudentIds(req.user);
  if (ids) {
    const { busIds } = await transportAccess(ids);
    rows = rows.filter((r) => busIds.has(r.bus.id));
  }
  res.json({ updatedAt: new Date().toISOString(), buses: rows });
});

/**
 * GET /api/parent/bus-tracking[?studentId=…][&busId=…]
 * The parent is identified from the JWT and their children are read from the database – ids sent by
 * the client only narrow the result, they never grant access. Asking for another family's student or
 * bus returns 403.
 */
export const parentBusTracking = asyncHandler(async (req, res) => {
  const childIds = await linkedStudentIds(req.user);
  const { studentId, busId } = req.query;
  if (studentId !== undefined && (typeof studentId !== 'string' || !childIds.includes(studentId))) {
    throw forbidden('You can only track the school bus of your own child.');
  }
  const data = await busTrackingFor(studentId ? [studentId] : childIds);
  if (busId !== undefined) {
    if (typeof busId !== 'string' || !data.buses.some((b) => b.bus.id === busId)) {
      throw forbidden('This bus is not assigned to your child.');
    }
    data.buses = data.buses.filter((b) => b.bus.id === busId);
  }
  res.json(data);
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
