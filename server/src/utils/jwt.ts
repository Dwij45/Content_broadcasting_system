import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { JwtPayload } from '../types/index.js';

export const signToken = (payload: JwtPayload): string =>
  jwt.sign(payload, env.JWT.SECRET, { 
    expiresIn: env.JWT.EXPIRES_IN as any 
  });

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT.SECRET) as JwtPayload;
};
