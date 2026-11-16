import { PERMISSIONS, STUDENT_OWNED } from '../config/permissions.js';
import { forbidden } from '../utils/httpError.js';
import { repo } from '../services/repository.js';

/** Student ids the current user may see (null = unrestricted). */
export function allowedStudentIds(user) {
  if (!user) return [];
  if (user.role === 'parent') return user.studentIds || [];
  if (user.role === 'student') return user.studentId ? [user.studentId] : [];
  return null;
}

/**
 * Like allowedStudentIds, but reads the parent ↔ child links from the database rather than the token,
 * so a link removed by the office takes effect immediately (not only after the parent signs in again).
 */
export async function linkedStudentIds(user) {
  if (user?.role !== 'parent') return allowedStudentIds(user);
  const account = await repo('users').get(user.id);
  return account?.studentIds || [];
}

/** Equality filter applied to list queries for the current user. */
export function scopeFilter(user, collection) {
  if (collection === 'notifications' && user) return { target: [user.role, user.id] };
  const ids = allowedStudentIds(user);
  if (!ids) return {};
  if (collection === 'students') return { id: ids };
  if (STUDENT_OWNED.has(collection)) return { studentId: ids };
  return {};
}

/** Does a single record fall inside the user's scope? */
export function inScope(user, collection, record) {
  if (!record) return false;
  if (collection === 'notifications' && user) return [user.role, user.id].includes(record.target);
  const ids = allowedStudentIds(user);
  if (!ids) return true;
  if (collection === 'students') return ids.includes(record.id);
  if (STUDENT_OWNED.has(collection)) return ids.includes(record.studentId);
  return true;
}

/**
 * Write-side ownership rules for non-staff roles that have limited create/update rights
 * (parents → leaves, students → submissions, anyone → marking own notifications read).
 */
export function assertWritable(user, collection, op, { existing, body }) {
  if (!user) return; // public create (enquiries) – handled by validation
  const rule = PERMISSIONS[collection];
  const isFullWriter = rule.write.includes(user.role);
  if (isFullWriter) return;

  if (collection === 'notifications') {
    if (!inScope(user, collection, existing)) throw forbidden();
    const keys = Object.keys(body || {}).filter((k) => k !== 'id');
    if (keys.some((k) => k !== 'read')) throw forbidden('Only the "read" flag can be changed.');
    return;
  }
  const ids = allowedStudentIds(user) || [];
  if (op === 'create' && !ids.includes(body?.studentId)) throw forbidden('You can only create records for your own child / yourself.');
  if (op === 'update') {
    if (!existing || !ids.includes(existing.studentId)) throw forbidden();
    if (body?.studentId && body.studentId !== existing.studentId) throw forbidden();
    if (collection === 'submissions' && (body?.marks !== undefined || body?.feedback !== undefined || body?.status === 'Graded')) {
      throw forbidden('Students cannot grade submissions.');
    }
  }
}
