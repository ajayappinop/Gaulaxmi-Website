import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { findDbUser } from '../services/users.js';
import { toPublicUser } from '../utils.js';
import { isPanelAdminUser } from '../../shared/adminPermissions.js';
import type { DbUser, User } from '../../shared/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'gaulaxmi-dev-secret-change-in-production';

export interface AuthPayload {
  userId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
      dbUser?: DbUser;
      publicUser?: User;
    }
  }
}

export function signToken(user: DbUser): string {
  return jwt.sign({ userId: user.id, role: user.role ?? 'member' }, JWT_SECRET, { expiresIn: '7d' });
}

/** Validates Bearer token and attaches user to the request. Returns false if a response was sent. */
export async function authenticateRequest(req: Request, res: Response): Promise<boolean> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return false;
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as AuthPayload;
    const user = await findDbUser(payload.userId);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return false;
    }
    if (user.isDeactivated) {
      res.status(403).json({ error: 'Account deactivated' });
      return false;
    }
    req.auth = payload;
    req.dbUser = user;
    req.publicUser = toPublicUser(user);
    return true;
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return false;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const ok = await authenticateRequest(req, res);
  if (ok) next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const ok = await authenticateRequest(req, res);
  if (!ok) return;
  if (!req.dbUser || !isPanelAdminUser(req.dbUser)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
