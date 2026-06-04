import type { Request, Response, NextFunction } from 'express';
import type { AdminPermission } from '../../shared/adminPermissions.js';
import { hasAdminPermission, isSuperAdminUser } from '../services/adminAccess.js';
import { requireAuth } from './auth.js';
import { isPanelAdminUser } from '../../shared/adminPermissions.js';

export function requirePanelAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.dbUser || !isPanelAdminUser(req.dbUser)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  requirePanelAdmin(req, res, () => {
    if (!req.dbUser || !isSuperAdminUser(req.dbUser)) {
      return res.status(403).json({ error: 'Super admin access required' });
    }
    next();
  });
}

export function requireAdminPermission(permission: AdminPermission) {
  return (req: Request, res: Response, next: NextFunction) => {
    requirePanelAdmin(req, res, () => {
      if (!req.dbUser || !hasAdminPermission(req.dbUser, permission)) {
        return res.status(403).json({ error: 'Permission denied for this area' });
      }
      next();
    });
  };
}
