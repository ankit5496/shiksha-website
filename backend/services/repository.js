import { existsSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { models } from '../models/index.js';
import { loadSeed } from './seedService.js';
import { uid } from '../utils/httpError.js';

/**
 * Repository interface (both adapters implement it):
 *   list(filter?)  get(id)  findOne(filter)  create(data)  update(id, patch)  remove(id)  bulkUpsert(rows)
 * `filter` is a plain object of equality matches; array values mean "field IN values".
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.resolve(here, '../data/db.json');

const matches = (row, filter = {}) =>
  Object.entries(filter).every(([k, v]) => (Array.isArray(v) ? v.includes(row[k]) : row[k] === v));

const strip = (doc) => {
  if (!doc) return doc;
  const { _id, createdAt, updatedAt, ...rest } = doc; // eslint-disable-line no-unused-vars
  return rest;
};

// ---------------- JSON file adapter (default, zero-setup) ----------------
let store = null;
let writeTimer = null;

function loadStore() {
  if (store) return store;
  if (existsSync(DB_FILE)) {
    store = JSON.parse(readFileSync(DB_FILE, 'utf8'));
  } else {
    store = loadSeed();
    flushNow();
  }
  return store;
}

function flushNow() {
  const tmp = `${DB_FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(store));
  renameSync(tmp, DB_FILE);
}

function scheduleFlush() {
  clearTimeout(writeTimer);
  writeTimer = setTimeout(flushNow, 250);
}

class JsonFileRepository {
  constructor(name) { this.name = name; }
  rows() { const s = loadStore(); s[this.name] ??= []; return s[this.name]; }
  async list(filter) { return this.rows().filter((r) => matches(r, filter)); }
  async get(id) { return this.rows().find((r) => r.id === id) ?? null; }
  async findOne(filter) { return this.rows().find((r) => matches(r, filter)) ?? null; }
  async create(data) {
    const row = { ...data, id: data.id || uid(this.name.slice(0, 2)) };
    if (this.rows().some((r) => r.id === row.id)) throw Object.assign(new Error('Duplicate id'), { status: 409 });
    store[this.name] = [row, ...this.rows()];
    scheduleFlush();
    return row;
  }
  async update(id, patch) {
    const rows = this.rows();
    const i = rows.findIndex((r) => r.id === id);
    if (i === -1) return null;
    rows[i] = { ...rows[i], ...patch, id };
    scheduleFlush();
    return rows[i];
  }
  async remove(id) {
    const before = this.rows().length;
    store[this.name] = this.rows().filter((r) => r.id !== id);
    scheduleFlush();
    return store[this.name].length < before;
  }
  async bulkUpsert(rows) {
    const map = new Map(this.rows().map((r) => [r.id, r]));
    rows.forEach((r) => map.set(r.id, { ...(map.get(r.id) || {}), ...r }));
    store[this.name] = [...map.values()];
    scheduleFlush();
    return rows.length;
  }
}

// ---------------- MongoDB adapter ----------------
const toMongo = (filter = {}) =>
  Object.fromEntries(Object.entries(filter).map(([k, v]) => [k, Array.isArray(v) ? { $in: v } : v]));

class MongoRepository {
  constructor(name) { this.model = models[name]; }
  async list(filter) { return (await this.model.find(toMongo(filter)).lean()).map(strip); }
  async get(id) { return strip(await this.model.findOne({ id }).lean()); }
  async findOne(filter) { return strip(await this.model.findOne(toMongo(filter)).lean()); }
  async create(data) {
    const doc = await this.model.create({ ...data, id: data.id || uid(this.model.collection.name.slice(0, 2)) });
    return strip(doc.toObject());
  }
  async update(id, patch) {
    const { id: _ignored, ...rest } = patch; // eslint-disable-line no-unused-vars
    return strip(await this.model.findOneAndUpdate({ id }, { $set: rest }, { new: true }).lean());
  }
  async remove(id) { return (await this.model.deleteOne({ id })).deletedCount > 0; }
  async bulkUpsert(rows) {
    if (!rows.length) return 0;
    await this.model.bulkWrite(rows.map((r) => ({ updateOne: { filter: { id: r.id }, update: { $set: r }, upsert: true } })));
    return rows.length;
  }
}

// ---------------- factory ----------------
let driver = 'json';
export const setDriver = (d) => { driver = d; };
export const getDriver = () => driver;

export function repo(name) {
  return driver === 'mongo' ? new MongoRepository(name) : new JsonFileRepository(name);
}

/** Replace all data with the seed (used by `npm run seed`). */
export async function resetAll() {
  const data = loadSeed();
  if (driver === 'mongo') {
    for (const [name, rows] of Object.entries(data)) {
      if (!models[name]) continue;
      await models[name].deleteMany({});
      if (rows.length) await models[name].insertMany(rows, { ordered: false });
    }
  } else {
    store = data;
    flushNow();
  }
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length]));
}

/** Ensures Mongo has data on first boot. */
export async function ensureSeeded() {
  if (driver === 'mongo') {
    if ((await models.users.countDocuments()) === 0) await resetAll();
  } else {
    loadStore();
  }
}
