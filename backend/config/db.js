import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

/** Connects to MongoDB when MONGODB_URI is set. Returns the storage driver in use. */
export async function connectDatabase() {
  if (!env.mongoUri) {
    logger.info('MONGODB_URI not set – using JSON file store (backend/data/db.json).');
    return 'json';
  }
  await mongoose.connect(env.mongoUri);
  logger.info('Connected to MongoDB.');
  return 'mongo';
}
