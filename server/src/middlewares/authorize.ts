import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../types/index.js';

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: `Access denied. Required role: ${allowedRoles.join(' or ')}` });
      return;
    }

    next(); 
  };
};