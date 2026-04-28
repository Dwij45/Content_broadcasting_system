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

export type ContentStatus = 'pending' | 'approved' | 'rejected';

export interface Content {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  file_url: string;           
  file_path: string;          
  file_type: string;          
  file_size: number;          
  uploaded_by: string;        
  status: ContentStatus;
  rejection_reason: string | null;
  approved_by: string | null; 
  approved_at: Date | null;
  start_time: Date | null;
  end_time: Date | null;
  rotation_duration: number;
  created_at: Date;
  updated_at: Date;
}

export interface ContentWithUsers extends Content {
  uploader_name: string;
  approver_name: string | null;
}
