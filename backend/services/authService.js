import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { repo } from './repository.js';

export const publicUser = (u) => {
  if (!u) return u;
  const { passwordHash, ...rest } = u; // eslint-disable-line no-unused-vars
  return rest;
};

export async function verifyCredentials(email, password) {
  const user = await repo('users').findOne({ email: String(email).trim().toLowerCase() });
  // Always run a compare to keep timing similar for unknown emails.
  const ok = await bcrypt.compare(String(password), user?.passwordHash || '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinval');
  return ok && user ? user : null;
}

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, studentIds: user.studentIds, studentId: user.studentId, teacherId: user.teacherId },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
