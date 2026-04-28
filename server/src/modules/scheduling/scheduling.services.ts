import { db } from '../../config/db.js';
import type { ContentWithUsers } from '../../types/index.js';

// What the public API returns per subject
export interface ActiveContentResult {
  teacher: { id: string; name: string };
  active_content: ContentWithUsers | Record<string, ContentWithUsers> | null;
  message?: string;
}

//  GET /api/broadcast/live/:teacherId
export const getLiveContent = async (
  teacherId: string,
  subject?: string
): Promise<ActiveContentResult> => {

  //  Verify teacher
  const teacherResult = await db.query<{ id: string; name: string }>(
    `SELECT id, name FROM users WHERE id = $1 AND role = 'teacher'`,
    [teacherId]
  );

  if (teacherResult.rows.length === 0) {
    throw { status: 404, message: 'Teacher not found' };
  }

  const teacher = teacherResult.rows[0]!;

  const now = new Date();
  const eligible = await getEligibleContent(teacherId, now, subject);

//  nothing eligible at all
  if (eligible.length === 0) {
    return {
      teacher,
      active_content: null,
      message: 'No content available',
    };
  }

  if (subject) {
    // Single subject requested → return one active item or null
    const active = pickActiveFromRotation(eligible, now);
    if (!active) {
      return { teacher, active_content: null, message: 'No content available' };
    }
    return { teacher, active_content: active };
  }

  //  group by subject
  const bySubject = groupBySubject(eligible);
  const result: Record<string, ContentWithUsers> = {};

  for (const [subj, items] of Object.entries(bySubject)) {
    const active = pickActiveFromRotation(items, now);
    if (active) result[subj] = active;
  }

  if (Object.keys(result).length === 0) {
    return { teacher, active_content: null, message: 'No content available' };
  }

  return { teacher, active_content: result };
};


// Eligible = approved + within time window + for this teacher
const getEligibleContent = async (
  teacherId: string,
  now: Date,
  subject?: string
): Promise<ContentWithUsers[]> => {

  const conditions = [
    `c.uploaded_by = $1`,
    `c.status = 'approved'`,
    `c.start_time IS NOT NULL`,
    `c.end_time IS NOT NULL`,
    `c.start_time <= $2`, 
    `c.end_time > $2`,     
  ];
  const params: unknown[] = [teacherId, now];

  if (subject) {
    params.push(subject.toLowerCase());
    conditions.push(`c.subject = $${params.length}`);
  }

  const result = await db.query<ContentWithUsers>(
    `SELECT
       c.*,
       u.name AS uploader_name,
       p.name AS approver_name
     FROM content c
     LEFT JOIN users u ON c.uploaded_by = u.id
     LEFT JOIN users p ON c.approved_by = p.id
     WHERE ${conditions.join(' AND ')}
     ORDER BY c.subject ASC, c.created_at ASC`,
    params
  );

  return result.rows;
};


const groupBySubject = (
  items: ContentWithUsers[]
): Record<string, ContentWithUsers[]> => {
  return items.reduce((acc, item) => {
    if (!acc[item.subject]) acc[item.subject] = [];
    acc[item.subject]!.push(item);
    return acc;
  }, {} as Record<string, ContentWithUsers[]>);
};


const pickActiveFromRotation = (
  items: ContentWithUsers[],
  now: Date
): ContentWithUsers | null => {

  // Nothing to rotate
  if (items.length === 0) return null;

  // always active,
  if (items.length === 1) return items[0]!;


  const epochMs = Math.min(
    ...items.map(i => new Date(i.start_time!).getTime())
  );

  // Sum all items' rotation durations
  // e.g. 5min + 3min + 7min = 15min = 900,000ms
  const totalCycleMs = items.reduce((sum, item) => {
    return sum + (item.rotation_duration || 5) * 60 * 1000;
  }, 0);

  if (totalCycleMs === 0) return items[0]!;

  const elapsedMs = (now.getTime() - epochMs) % totalCycleMs;

  let cursor = 0;

  for (const item of items) {
    const slotMs = (item.rotation_duration || 5) * 60 * 1000;

    if (elapsedMs >= cursor && elapsedMs < cursor + slotMs) {
      return item; 
    }

    cursor += slotMs;
  }

  return items[0]!;
};
const broadcastService = {
    getLiveContent,
    getEligibleContent,
    groupBySubject,
    pickActiveFromRotation
}
export default broadcastService