export type UserRole = 'principal' | 'teacher';

export interface User {
  id: string;           // UUID
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
}
// (never expose password_hash in responses)
export type SafeUser = Omit<User, 'password_hash'>;
export interface JwtPayload {
  id: string;
  email?: string;
  role: UserRole;
  name?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}
export interface AuthResult {
  user: SafeUser;
  token: string;
}
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload; // set by authenticate middleware
    }
  }
}
