import { PERMISSIONS } from '../config/permissions.js';
import { forbidden, notFound, unauthorized } from '../utils/httpError.js';

/** Restrict a route to specific roles. */
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(unauthorized());
  if (!roles.includes(req.user.role)) return next(forbidden());
  next();
};

/**
 * Collection-level permission check for the generic resource routes.
 * op: 'read' | 'create' | 'update' | 'delete'
 */
export const permit = (op) => (req, _res, next) => {
  const rule = PERMISSIONS[req.params.collection];
  if (!rule) return next(notFound(`Unknown resource "${req.params.collection}".`));

  const publicOps = rule.public || [];
  if (!req.user) {
    if ((op === 'read' && publicOps.includes('read')) || (op === 'create' && publicOps.includes('create'))) return next();
    return next(unauthorized());
  }

  const role = req.user.role;
  const allowed =
    op === 'read' ? rule.read.includes(role)
      : op === 'create' ? rule.write.includes(role) || (rule.create || []).includes(role) || publicOps.includes('create')
        : op === 'update' ? rule.write.includes(role) || (rule.update || []).includes(role)
          : rule.write.includes(role);

  if (!allowed) return next(forbidden(`The ${role} role cannot ${op} ${req.params.collection}.`));
  next();
};
