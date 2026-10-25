import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { forbidden, unauthorized } from '../errors';

/** Authentication: verifies the bearer token and stores { id, role } on res.locals.user. */
export const authenticate: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw unauthorized();

  let payload: string | jwt.JwtPayload;
  try {
    payload = jwt.verify(header.slice(7).trim(), config.jwtSecret, { algorithms: ['HS256'] });
  } catch {
    throw unauthorized('Invalid or expired token');
  }
  if (typeof payload === 'string' || typeof payload.sub !== 'string' ||
      (payload.role !== 'USER' && payload.role !== 'ADMIN')) {
    throw unauthorized('Invalid token');
  }

  res.locals.user = { id: payload.sub, role: payload.role };
  next();
};

/** Authorization: must run after `authenticate`, so a missing token is 401 not 403. */
export const requireAdmin: RequestHandler = (_req, res, next) => {
  if (res.locals.user?.role !== 'ADMIN') throw forbidden();
  next();
};
