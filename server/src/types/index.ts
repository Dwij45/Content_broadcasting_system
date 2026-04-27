export type UserRole = 'principal' | 'teacher';

export interface User {
  id: string;           // UUID
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
}
export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  name: string;
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
