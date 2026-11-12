/**
 * Resets the database (JSON file store or MongoDB) from backend/data/seed.json.
 * Usage: npm run seed
 */
import mongoose from 'mongoose';
import { connectDatabase } from '../config/db.js';
import { resetAll, setDriver } from '../services/repository.js';
import { logger } from './logger.js';

const driver = await connectDatabase();
setDriver(driver);
const counts = await resetAll();
logger.info(`Database reset (${driver}).`, counts);
if (driver === 'mongo') await mongoose.disconnect();
