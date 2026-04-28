import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import type { UserRole } from '../types/index.js';

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
//  Authorization: Bearer <token>
  const authHeader = req.headers.authorization || req.cookies['token']; 

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Access token is required' });
    return; 
  }

  const token = authHeader.split(' ')[1];

  try {

    const decoded = verifyToken(token);
    req.user = decoded;

    next(); 
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.name === 'TokenExpiredError') {
        res.status(401).json({ message: 'Token has expired, please login again' });
        return;
      }
      if (err.name === 'JsonWebTokenError') {
        res.status(401).json({ message: 'Invalid token' });
        return;
      }
    }
    res.status(401).json({ message: 'Authentication failed' });
  }
};
