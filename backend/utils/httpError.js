export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (m, d) => new HttpError(400, m, d);
export const unauthorized = (m = 'Authentication required.') => new HttpError(401, m);
export const forbidden = (m = 'You do not have permission to perform this action.') => new HttpError(403, m);
export const notFound = (m = 'Resource not found.') => new HttpError(404, m);

/** Wraps async route handlers so rejected promises reach the error handler. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const uid = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
