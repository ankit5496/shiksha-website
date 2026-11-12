/**
 * Exports the demo seed (same generator the browser mock DB uses) to backend/data/seed.json
 * so the Express API serves identical sample data.  Run: npm run export-seed
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSeed } from '../src/data/seed';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../../backend/data/seed.json');
mkdirSync(path.dirname(out), { recursive: true });
const seed = buildSeed();
writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), collections: seed }, null, 0));
const counts = Object.entries(seed).map(([k, v]) => `${k}:${(v as unknown[]).length}`).join(' ');
console.log(`Seed written to ${out}\n${counts}`);
