import type { QueryResult, QueryResultRow } from 'pg';
import {Pool} from 'pg';
import { env } from './env.js';

const pool = new Pool({
  host:     env.DB.HOST,
  port:     env.DB.PORT,
  database: env.DB.NAME,
  user:     env.DB.USER,
  password: env.DB.PASSWORD,

  max: 10,              
  idleTimeoutMillis: 30000,   
  connectionTimeoutMillis: 5000, 
});

pool.on('error', (err: Error) => {
  console.error(' Unexpected DB pool error:', err.message);
});
export const db = {

  query: async <T extends QueryResultRow = Record<string, unknown>>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> => {
    // measures
    const start = Date.now();
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;

    // Only log in development 
    // prints the SQL query
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DB] ${duration}ms | rows:${result.rowCount} | ${text.slice(0, 80)}`);
    }

    return result;
  },
  pool,
};