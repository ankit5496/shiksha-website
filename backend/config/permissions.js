/**
 * Role-based access matrix for the generic /api/:collection resource routes.
 *
 *  read  – roles allowed to list/get. Parent and student reads are additionally SCOPED (see middleware/scope.js).
 *  write – roles allowed to create/update/delete.
 *  create – (optional) roles allowed to create only (e.g. parents submitting leave requests).
 *  public – (optional) unauthenticated access: 'read' and/or 'create' (website gallery, enquiry forms).
 *
 * `users` is deliberately absent: accounts are never exposed through the generic route.
 */
const STAFF = ['admin', 'office'];
const ALL = ['admin', 'office', 'teacher', 'parent', 'student'];

export const PERMISSIONS = {
  students:      { read: ALL, write: STAFF },
  // parents/students need teacher names (class teacher, timetable, messaging); writes stay admin-only
  teachers:      { read: ['admin', 'office', 'teacher', 'parent', 'student'], write: ['admin'] },
  classes:       { read: ALL, write: ['admin'] },
  subjects:      { read: ALL, write: ['admin'] },
  timetable:     { read: ALL, write: ['admin'] },
  attendance:    { read: ALL, write: ['admin', 'office', 'teacher'] },
  homework:      { read: ALL, write: ['admin', 'teacher'] },
  exams:         { read: ALL, write: ['admin'] },
  results:       { read: ALL, write: ['admin', 'teacher'] },
  announcements: { read: ALL, write: STAFF, public: ['read'] },
  circulars:     { read: ALL, write: STAFF },
  events:        { read: ALL, write: STAFF, public: ['read'] },
  leaves:        { read: ALL, write: ['admin', 'office', 'teacher'], create: ['parent'] },
  notifications: { read: ALL, write: STAFF, update: ALL },
  feeStructures: { read: ALL, write: STAFF },
  studentFees:   { read: ALL, write: STAFF },
  payments:      { read: ALL, write: STAFF },
  drivers:       { read: ALL, write: STAFF },
  routes:        { read: ALL, write: STAFF },
  buses:         { read: ALL, write: STAFF },
  materials:     { read: ALL, write: ['admin', 'teacher'] },
  assignments:   { read: ALL, write: ['admin', 'teacher'] },
  submissions:   { read: ALL, write: ['admin', 'teacher'], create: ['student'], update: ['student'] },
  gallery:       { read: ALL, write: STAFF, public: ['read'] },
  enquiries:     { read: STAFF, write: STAFF, public: ['create'] },
};

/** Collections whose rows belong to a single student (scoped for parent/student roles). */
export const STUDENT_OWNED = new Set(['attendance', 'results', 'leaves', 'studentFees', 'payments', 'submissions']);

export const COLLECTIONS = Object.keys(PERMISSIONS);
