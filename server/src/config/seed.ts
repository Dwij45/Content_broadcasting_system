import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { env } from './env.js';

const seed = async (): Promise<void> => {
  try {
    // Hash once, reuse for all seed users
    const hash = await bcrypt.hash('password123', env.BCRYPT_SALT_ROUNDS);

    const users = [
      { name: 'Principal Admin', email: 'principal@school.com', role: 'principal' },
      { name: 'Teacher One',     email: 'teacher1@school.com',  role: 'teacher'   },
      { name: 'Teacher Two',     email: 'teacher2@school.com',  role: 'teacher'   },
      { name: 'Teacher Three',   email: 'teacher3@school.com',  role: 'teacher'   },
    ];

    for (const user of users) {
      await db.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO NOTHING`,
        [user.name, user.email, hash, user.role]
      );
      console.log(`Seeded: ${user.email} (${user.role})`);
    }

    console.log('\n All credentials use password: password123');

    // -- Create Content for Scheduling Demonstration --
    const principalRes = await db.query('SELECT id FROM users WHERE email = $1', ['principal@school.com']);
    const teacherOneRes = await db.query('SELECT id FROM users WHERE email = $1', ['teacher1@school.com']);
    
    if (principalRes.rows.length && teacherOneRes.rows.length) {
      const pId = principalRes.rows[0]!.id;
      const t1Id = teacherOneRes.rows[0]!.id;

      console.log('\n Seeding demonstration scheduled content...');
      const now = new Date();
      // start time 10 minutes ago
      const startTime = new Date(now.getTime() - 10 * 60000); 
      // end time 10 days from now
      const endTime = new Date(now.getTime() + 10 * 24 * 60 * 60000);

      const contents = [
        {
          title: 'Math Concept 1 - Algebra Basics',
          subject: 'maths',
          file_url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
          file_path: 'sample-math-1.mp4',
          file_type: 'video/mp4',
          rotation_duration: 3, // 3 minutes slot
        },
        {
          title: 'Math Concept 2 - Geometry',
          subject: 'maths',
          file_url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_2mb.mp4',
          file_path: 'sample-math-2.mp4',
          file_type: 'video/mp4',
          rotation_duration: 2, // 2 minutes slot
        },
        {
          title: 'Science Experiment - Physics',
          subject: 'science',
          file_url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
          file_path: 'sample-science-1.mp4',
          file_type: 'video/mp4',
          rotation_duration: 5, // 5 minutes slot
        }
      ];

      for (const c of contents) {
        await db.query(
          `INSERT INTO content 
            (title, subject, file_url, file_path, file_type, file_size, uploaded_by, status, approved_by, approved_at, start_time, end_time, rotation_duration)
           VALUES ($1, $2, $3, $4, $5, 1024, $6, 'approved', $7, NOW(), $8, $9, $10)`,
          [c.title, c.subject, c.file_url, c.file_path, c.file_type, t1Id, pId, startTime, endTime, c.rotation_duration]
        );
        console.log(`Seeded Content: ${c.title} (Subject: ${c.subject}, Slot: ${c.rotation_duration}min)`);
      }
    }

  } catch (err) {
    console.error('Seed failed:', err);
    throw err;
  } finally {
    await db.pool.end();
  }
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
