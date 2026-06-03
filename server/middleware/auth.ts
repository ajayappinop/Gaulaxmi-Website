import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { readDb } from '../db.js';
import { isAdminUser, toPublicUser } from '../utils.js';
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

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as AuthPayload;
    const db = readDb();
    const user = db.users.find((u) => u.id === payload.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.isDeactivated) return res.status(403).json({ error: 'Account deactivated' });
    req.auth = payload;
    req.dbUser = user;
    req.publicUser = toPublicUser(user);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.dbUser || !isAdminUser(req.dbUser)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}
