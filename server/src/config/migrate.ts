import { db } from "./db.js";

const migrate = async () => {
    const client = await db.pool.connect();
    try{
        await client.query('BEGIN')
        await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
        await client.query(`
        CREATE TABLE IF NOT EXISTS users (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name          VARCHAR(255)  NOT NULL,
            email         VARCHAR(255)  UNIQUE NOT NULL,
            password_hash VARCHAR(255)  NOT NULL,
            role          VARCHAR(50)   NOT NULL CHECK (role IN ('principal', 'teacher')),
            created_at    TIMESTAMPTZ   DEFAULT NOW()
        );
    `);
      await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
     await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `);

    await client.query('COMMIT'); // save all changes
    console.log('Migration successful — tables created');

    }
    catch(err){
        await client.query('ROLLBACK'); // undo everything
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release(); // return connection to pool
    await db.pool.end(); // close pool
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
