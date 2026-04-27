import bcrypt from 'bcryptjs';
import { db } from '../../config/db.js';
import { env } from '../../config/env.js';
import { signToken } from '../../utils/jwt.js';
import type { SafeUser, User , AuthResult} from '../../types/index.js';
import type { RegisterInput, LoginInput } from './auth.schema.js';


const register = async (input:RegisterInput):Promise<AuthResult> =>{
    const {name,email,password,role} = input;
    
    const existing = await db.query<{ id: string }>(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );
  if(existing.rows.length > 0){
    throw new Error('User already exists');
  }
  const password_hash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

  const result = await db.query<SafeUser>(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [name, email, password_hash, role]
  );

  const user = result.rows[0];
  if (!user) {
    throw new Error('User registration failed');
  }

  const token = signToken({
    id:    user.id,
    role:  user.role,
  });

  return { user, token };
}

const login = async (input:LoginInput):Promise<AuthResult> =>{
    const {email,password} = input;
    const result = await db.query<User>(
    `SELECT id, name, email, password_hash, role, created_at
     FROM users
     WHERE email = $1`,
    [email]
  );

  if (result.rows.length === 0 || !result.rows[0]) {
    throw new Error('User not found');
  }

  const user = result.rows[0];

  
  // Step 3: Compare password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
      throw new Error('Invalid password');
    }

const { password_hash: _hash, ...safeUser } = user;

  // Step 4: Generate JWT
  const token = signToken({
    id:    user.id,
    email: user.email,
    role:  user.role,
    name:  user.name,
  });

  return { user: safeUser as SafeUser, token };
}
export const getProfile = async (userId: string): Promise<SafeUser> => {
  const result = await db.query<SafeUser>(
    `SELECT id, name, email, role, created_at
     FROM users
     WHERE id = $1`,
    [userId]
  );

  const user = result.rows[0];
  if (!user) {
    throw { status: 404, message: 'User not found' };
  }

  return user;
};

const authService = { register, login, getProfile };
export default authService;