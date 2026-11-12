import { asyncHandler, badRequest, forbidden, notFound, unauthorized } from '../utils/httpError.js';
import { publicUser, signToken, verifyCredentials } from '../services/authService.js';
import { repo } from '../services/repository.js';

const ROLES = ['admin', 'office', 'parent', 'teacher', 'student'];

/** POST /api/auth/login { email, password, role? } */
export const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password) throw badRequest('Email and password are required.');
  if (role && !ROLES.includes(role)) throw badRequest('Unknown portal role.');
  const user = await verifyCredentials(email, password);
  if (!user) throw unauthorized('Invalid email or password.');
  if (role && user.role !== role) throw forbidden(`This account does not have access to the ${role} portal.`);
  res.json({ user: publicUser(user), token: signToken(user) });
});

/** GET /api/auth/me */
export const me = asyncHandler(async (req, res) => {
  const user = await repo('users').get(req.user.id);
  if (!user) throw notFound('User no longer exists.');
  res.json({ user: publicUser(user) });
});
