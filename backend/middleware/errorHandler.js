import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found.` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const status = err.status || (err.type === 'entity.parse.failed' ? 400 : 500);
  if (status >= 500) logger.error(err);
  res.status(status).json({
    message: status >= 500 && env.isProd ? 'Internal server error.' : err.message,
    ...(err.details ? { details: err.details } : {}),
  });
}
