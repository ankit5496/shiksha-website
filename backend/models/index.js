import mongoose from 'mongoose';
import { COLLECTIONS } from '../config/permissions.js';

/**
 * Mongoose models.
 * Every record carries a string `id` (shared with the frontend types in frontend/src/types/index.ts).
 * Domain collections use a flexible schema (strict: false) with indexed key fields so the API can
 * evolve with the UI; tighten individual schemas as the product matures.
 */
const base = { id: { type: String, required: true, unique: true, index: true } };
const opts = { strict: false, versionKey: false, timestamps: true };

const UserSchema = new mongoose.Schema({
  ...base,
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  role: { type: String, enum: ['admin', 'office', 'parent', 'teacher', 'student'], required: true },
  passwordHash: { type: String, required: true },
  phone: String,
  avatar: String,
  studentIds: [String],
  studentId: String,
  teacherId: String,
}, { versionKey: false, timestamps: true });

/** Fields worth indexing per collection (used for scoped/filtered queries). */
const INDEXES = {
  students: ['classId', 'admissionNo'],
  attendance: ['studentId', 'date'],
  results: ['studentId'],
  payments: ['studentId', 'receiptNo'],
  studentFees: ['studentId'],
  leaves: ['studentId'],
  submissions: ['assignmentId', 'studentId'],
  timetable: ['classId'],
  homework: ['classId'],
  materials: ['classId', 'subject'],
  assignments: ['classId'],
  notifications: ['target'],
};

const models = { users: mongoose.models.User || mongoose.model('User', UserSchema, 'users') };

for (const name of COLLECTIONS) {
  const schema = new mongoose.Schema({ ...base }, opts);
  (INDEXES[name] || []).forEach((f) => schema.index({ [f]: 1 }));
  const modelName = name.charAt(0).toUpperCase() + name.slice(1);
  models[name] = mongoose.models[modelName] || mongoose.model(modelName, schema, name);
}

export { models };
