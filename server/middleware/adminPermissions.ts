import type { Request, Response, NextFunction } from 'express';
import type { AdminPermission } from '../../shared/adminPermissions.js';
import { hasAdminPermission, isSuperAdminUser } from '../services/adminAccess.js';
import { authenticateRequest } from './auth.js';
import { isPanelAdminUser } from '../../shared/adminPermissions.js';

export async function requirePanelAdmin(req: Request, res: Response, next: NextFunction) {
  const ok = await authenticateRequest(req, res);
  if (!ok) return;
  if (!req.dbUser || !isPanelAdminUser(req.dbUser)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export async function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const ok = await authenticateRequest(req, res);
  if (!ok) return;
  if (!req.dbUser || !isPanelAdminUser(req.dbUser)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  if (!isSuperAdminUser(req.dbUser)) {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
}

export function requireAdminPermission(permission: AdminPermission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ok = await authenticateRequest(req, res);
    if (!ok) return;
    if (!req.dbUser || !isPanelAdminUser(req.dbUser)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    if (!hasAdminPermission(req.dbUser, permission)) {
      return res.status(403).json({ error: 'Permission denied for this area' });
    }
    next();
  };
}
