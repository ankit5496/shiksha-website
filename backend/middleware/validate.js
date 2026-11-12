import { badRequest } from '../utils/httpError.js';

/** Required-field validation per collection for create requests. */
export const REQUIRED = {
  students: ['name', 'classId', 'section', 'admissionNo'],
  teachers: ['name', 'email'],
  classes: ['name'],
  subjects: ['name'],
  attendance: ['studentId', 'date', 'status'],
  homework: ['classId', 'subject', 'title', 'dueDate'],
  exams: ['name', 'classId', 'subject', 'date'],
  results: ['studentId', 'examName', 'subject', 'marks'],
  announcements: ['title', 'body'],
  circulars: ['title'],
  events: ['title', 'date'],
  leaves: ['studentId', 'fromDate', 'toDate', 'reason'],
  notifications: ['target', 'title'],
  feeStructures: ['classId', 'items'],
  payments: ['studentId', 'amount'],
  drivers: ['name', 'phone'],
  routes: ['name'],
  buses: ['number'],
  materials: ['classId', 'subject', 'title'],
  assignments: ['classId', 'subject', 'title', 'dueDate'],
  submissions: ['assignmentId', 'studentId'],
  enquiries: ['name', 'phone', 'message'],
};

const blank = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

export function requireFields(fields) {
  return (req, _res, next) => {
    const missing = fields.filter((f) => blank(req.body?.[f]));
    if (missing.length) return next(badRequest(`Missing required field(s): ${missing.join(', ')}`, { missing }));
    next();
  };
}

export function validateCreate(req, _res, next) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return next(badRequest('Request body must be a JSON object.'));
  return requireFields(REQUIRED[req.params.collection] || [])(req, _res, next);
}
