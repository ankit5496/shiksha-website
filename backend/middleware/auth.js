import { verifyToken } from '../services/authService.js';
import { unauthorized } from '../utils/httpError.js';

function readUser(req) {
  const h = req.headers.authorization || '';
  const [scheme, token] = h.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  try {
    const p = verifyToken(token);
    return { id: p.sub, role: p.role, studentIds: p.studentIds || [], studentId: p.studentId, teacherId: p.teacherId };
  } catch {
    return undefined; // invalid / expired
  }
}

/** Requires a valid Bearer JWT → req.user */
export function requireAuth(req, _res, next) {
  const user = readUser(req);
  if (user === undefined) return next(unauthorized('Session expired or invalid token. Please sign in again.'));
  if (!user) return next(unauthorized());
  req.user = user;
  next();
}

/** Attaches req.user when a valid token is present; continues anonymously otherwise. */
export function optionalAuth(req, _res, next) {
  const user = readUser(req);
  if (user) req.user = user;
  next();
}
