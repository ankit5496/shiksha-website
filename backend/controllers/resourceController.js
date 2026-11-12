import { asyncHandler, badRequest, notFound } from '../utils/httpError.js';
import { repo } from '../services/repository.js';
import { assertWritable, inScope, scopeFilter } from '../middleware/scope.js';

/** Fields clients may never set directly. */
const sanitize = (body = {}) => {
  const { _id, createdAt, updatedAt, passwordHash, ...rest } = body; // eslint-disable-line no-unused-vars
  return rest;
};

const today = () => new Date().toISOString().slice(0, 10);

/** Server-side defaults for records created by non-staff or anonymous users. */
function applyCreateDefaults(collection, user, data) {
  if (collection === 'enquiries' && !['admin', 'office'].includes(user?.role)) {
    return { ...data, status: 'New', date: today() };
  }
  if (collection === 'leaves' && user?.role === 'parent') return { ...data, status: 'Pending', appliedOn: today() };
  if (collection === 'submissions' && user?.role === 'student') {
    const { marks, feedback, ...rest } = data; // eslint-disable-line no-unused-vars
    return { ...rest, status: rest.status === 'Late' ? 'Late' : 'Submitted', submittedAt: rest.submittedAt || today() };
  }
  return data;
}

/** GET /api/:collection  (query-string equality filters supported, e.g. ?classId=c8&section=A) */
export const list = asyncHandler(async (req, res) => {
  const { collection } = req.params;
  const query = Object.fromEntries(Object.entries(req.query).filter(([, v]) => typeof v === 'string'));
  const scope = req.user ? scopeFilter(req.user, collection) : {};
  // scope keys win over client-supplied filters
  const rows = await repo(collection).list({ ...query, ...scope });
  res.json(rows);
});

/** GET /api/:collection/:id */
export const getOne = asyncHandler(async (req, res) => {
  const { collection, id } = req.params;
  const row = await repo(collection).get(id);
  if (!row || (req.user && !inScope(req.user, collection, row))) throw notFound();
  res.json(row);
});

/** POST /api/:collection */
export const create = asyncHandler(async (req, res) => {
  const { collection } = req.params;
  const body = sanitize(req.body);
  assertWritable(req.user, collection, 'create', { body });
  const row = await repo(collection).create(applyCreateDefaults(collection, req.user, body));
  res.status(201).json(row);
});

/** PUT /api/:collection/:id  (partial update / merge) */
export const update = asyncHandler(async (req, res) => {
  const { collection, id } = req.params;
  const existing = await repo(collection).get(id);
  if (!existing) throw notFound();
  const body = sanitize(req.body);
  assertWritable(req.user, collection, 'update', { existing, body });
  res.json(await repo(collection).update(id, body));
});

/** DELETE /api/:collection/:id */
export const remove = asyncHandler(async (req, res) => {
  const { collection, id } = req.params;
  const ok = await repo(collection).remove(id);
  if (!ok) throw notFound();
  res.status(204).end();
});

/** POST /api/:collection/bulk  body: array of full records (upsert by id) */
export const bulkUpsert = asyncHandler(async (req, res) => {
  const { collection } = req.params;
  if (!Array.isArray(req.body)) throw badRequest('Body must be an array of records.');
  if (req.body.length > 5000) throw badRequest('Too many records in one request (max 5000).');
  const rows = req.body.map(sanitize);
  if (rows.some((r) => !r.id)) throw badRequest('Every record needs an id.');
  const r = repo(collection);
  for (const row of rows) {
    const existing = await r.get(row.id);
    assertWritable(req.user, collection, existing ? 'update' : 'create', { existing, body: row });
  }
  const count = await r.bulkUpsert(rows);
  res.json({ upserted: count });
});
