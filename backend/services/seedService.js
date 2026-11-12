import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SEED_FILE = path.resolve(here, '../data/seed.json');

/**
 * Loads backend/data/seed.json (exported from the frontend generator with `npm run export-seed`)
 * and hashes the demo password for every user account.
 */
export function loadSeed() {
  if (!existsSync(SEED_FILE)) {
    throw new Error('backend/data/seed.json is missing. Run `npm run export-seed` inside /frontend first.');
  }
  const { collections } = JSON.parse(readFileSync(SEED_FILE, 'utf8'));
  const hash = bcrypt.hashSync(env.demoPassword, 10);
  collections.users = collections.users.map((u) => ({ ...u, passwordHash: hash }));
  return collections;
}
