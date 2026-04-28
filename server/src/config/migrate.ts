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
await client.query(`
      CREATE TABLE IF NOT EXISTS content (
        id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        title             VARCHAR(255) NOT NULL,
        description       TEXT,
        subject           VARCHAR(100) NOT NULL,
        file_url          VARCHAR(500) NOT NULL,
        file_path         VARCHAR(500) NOT NULL,
        file_type         VARCHAR(50)  NOT NULL,
        file_size         INTEGER      NOT NULL,
        uploaded_by       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status            VARCHAR(50)  NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'approved', 'rejected')),
        rejection_reason  TEXT,
        approved_by       UUID         REFERENCES users(id) ON DELETE SET NULL,
        approved_at       TIMESTAMPTZ,
        start_time        TIMESTAMPTZ,
        end_time          TIMESTAMPTZ,
        rotation_duration INTEGER      NOT NULL DEFAULT 5,
        created_at        TIMESTAMPTZ  DEFAULT NOW(),
        updated_at        TIMESTAMPTZ  DEFAULT NOW()
      );
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_content_uploaded_by        ON content(uploaded_by);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_content_status             ON content(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_content_subject            ON content(subject);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_content_status_uploaded_by ON content(status, uploaded_by);`);

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
