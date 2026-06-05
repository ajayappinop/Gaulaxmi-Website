import type { RequestHandler } from 'express';

/** Wrap async route handlers so rejected promises reach Express error middleware. */
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
