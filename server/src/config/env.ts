import dotenv from 'dotenv';
dotenv.config();

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const optional = (key: string, fallback: string): string => {
  return process.env[key] ?? fallback;
};


export const env = {
  PORT: parseInt(optional('PORT', '3000'), 10),

  DB: {
    HOST:     process.env.DB_HOST     || process.env.PGHOST     || 'localhost',
    PORT:     parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
    NAME:     process.env.DB_NAME     || process.env.PGDATABASE || 'cbs_db',
    USER:     process.env.DB_USER     || process.env.PGUSER     || 'postgres',
    PASSWORD: process.env.DB_PASSWORD || process.env.PGPASSWORD || '',
  },

  JWT: {
    SECRET:     optional('JWT_SECRET', 'fallback_secret_change_me'),
    EXPIRES_IN: optional('JWT_EXPIRES_IN', '7d'),
  },

  BCRYPT_SALT_ROUNDS: parseInt(optional('BCRYPT_SALT_ROUNDS', '10'), 10),
};
