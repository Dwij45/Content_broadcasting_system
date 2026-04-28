// src/modules/content/content.service.ts
// ─────────────────────────────────────────────────────────────
// All business logic for content: upload, list, get, delete.
// Approval logic will be added in the next module.
//
// KEY DESIGN DECISIONS:
//
// 1. PARAMETERISED QUERIES ($1, $2, $3...)
//    NEVER do: `SELECT * FROM content WHERE id = '${id}'`
//    ALWAYS do: `SELECT * FROM content WHERE id = $1`, [id]
//    Why? SQL injection. User could pass id = "' OR '1'='1"
//    Parameterised queries prevent this at the DB driver level.
//
// 2. PAGINATION
//    Never return all rows — could be thousands.
//    LIMIT + OFFSET = return N rows starting from position X
//    page=1, limit=20 → OFFSET=0  → rows 1-20
//    page=2, limit=20 → OFFSET=20 → rows 21-40
//
// 3. LEFT JOIN for user names
//    content table has uploaded_by (UUID) and approved_by (UUID)
//    Frontend needs names, not UUIDs.
//    JOIN gets both in one query instead of multiple round trips.
//
// 4. Dynamic WHERE clause building
//    Filters (status, subject) are optional query params.
//    We build the WHERE clause dynamically based on what's provided.
//    This avoids writing 8 different queries for every combination.
// ─────────────────────────────────────────────────────────────
import type { Request } from 'express';
import { db } from '../../config/db.js';
import { s3 } from '../../middlewares/uppload.middleware.js';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { ContentWithUsers } from '../../types/index.js';
import type { UploadContentInput, ListContentQuery } from './content.schema.js';

// ── What list endpoints return (data + pagination info) ───────
interface PaginatedResult {
  data: ContentWithUsers[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// ── Upload ────────────────────────────────────────────────────
// Called after multer has already saved the file to disk.
// req.file is guaranteed to exist here (controller checks first).
export const uploadContent = async (
  req: Request,
  input: UploadContentInput
): Promise<ContentWithUsers> => {

  const file = req.file as any; 

  const fileUrl = file.location; // S3 URL provided by multer-s3
  const filePath = file.key;    // S3 Key (filename in bucket)

  const result = await db.query<ContentWithUsers>(
    `INSERT INTO content
       (title, description, subject, file_url, file_path,
        file_type, file_size, uploaded_by, start_time, end_time, rotation_duration)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING
       id, title, description, subject, file_url, file_path,
       file_type, file_size, uploaded_by, status, rejection_reason,
       approved_by, approved_at, start_time, end_time,
       rotation_duration, created_at, updated_at`,
    [
      input.title,
      input.description ?? null,
      input.subject,          // already lowercased by Zod schema
      fileUrl,
      filePath,               // S3 key for internal use
      file.mimetype,          // image/jpeg etc
      file.size,              // bytes
      req.user?.id as string, // teacher's user id from JWT
      input.start_time ?? null,
      input.end_time   ?? null,
      input.rotation_duration, // default 5 if not provided
    ]
  );

  // Fetch with joined names for the response
  if (!result.rows[0]) throw new Error('Failed to insert content');
  return getContentById(result.rows[0].id);
};

// ── Get Single Content by ID ──────────────────────────────────
// JOINs user names so we don't return raw UUIDs
export const getContentById = async (contentId: string): Promise<ContentWithUsers> => {
  const result = await db.query<ContentWithUsers>(
    `SELECT
       c.*,
       u.name  AS uploader_name,
       p.name  AS approver_name
     FROM content c
     LEFT JOIN users u ON c.uploaded_by = u.id
     LEFT JOIN users p ON c.approved_by = p.id
     WHERE c.id = $1`,
    [contentId]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Content not found' };
  }

  return result.rows[0]!;
};

// ── Get Teacher's Own Content ─────────────────────────────────
// Teachers can only see content they uploaded.
// Optional filters: status, subject, pagination.
export const getMyContent = async (
  teacherId: string,
  query: ListContentQuery
): Promise<PaginatedResult> => {

  const { status, subject, page, limit } = query;
  const offset = (page - 1) * limit;

  // Build WHERE clause dynamically
  // We start with the mandatory condition (uploaded_by)
  // then add optional conditions based on what's provided
  const conditions: string[] = ['c.uploaded_by = $1'];
  const params: unknown[] = [teacherId];

  if (status) {
    params.push(status);
    conditions.push(`c.status = $${params.length}`);
  }

  if (subject) {
    params.push(subject);
    conditions.push(`c.subject = $${params.length}`);
  }

  const whereClause = conditions.join(' AND ');

  // First query: get total count (for pagination metadata)
  const countResult = await db.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM content c WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0]?.count || '0', 10);

  // Second query: get the actual page of data
  // We push limit and offset AFTER the filter params
  params.push(limit, offset);
  const dataResult = await db.query<ContentWithUsers>(
    `SELECT
       c.*,
       u.name AS uploader_name,
       p.name AS approver_name
     FROM content c
     LEFT JOIN users u ON c.uploaded_by = u.id
     LEFT JOIN users p ON c.approved_by = p.id
     WHERE ${whereClause}
     ORDER BY c.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    data: dataResult.rows,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
};

// ── Get All Content (Principal view) ─────────────────────────
// Principal sees everything — all teachers, all statuses.
// Optional filters: status, subject, teacher_id, pagination.
export const getAllContent = async (
  query: ListContentQuery & { teacher_id?: string }
): Promise<PaginatedResult> => {

  const { status, subject, page, limit } = query;
  const teacherId = query.teacher_id;
  const offset = (page - 1) * limit;

  // No mandatory condition — principal sees all
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (status) {
    params.push(status);
    conditions.push(`c.status = $${params.length}`);
  }

  if (subject) {
    params.push(subject);
    conditions.push(`c.subject = $${params.length}`);
  }

  if (teacherId) {
    params.push(teacherId);
    conditions.push(`c.uploaded_by = $${params.length}`);
  }

  // Build WHERE clause — if no filters, no WHERE needed
  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const countResult = await db.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM content c ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0]?.count || '0', 10);

  params.push(limit, offset);
  const dataResult = await db.query<ContentWithUsers>(
    `SELECT
       c.*,
       u.name AS uploader_name,
       p.name AS approver_name
     FROM content c
     LEFT JOIN users u ON c.uploaded_by = u.id
     LEFT JOIN users p ON c.approved_by = p.id
     ${whereClause}
     ORDER BY c.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    data: dataResult.rows,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
};

// ── Delete Content ────────────────────────────────────────────
// Removes the DB row AND the file from disk.
// Teachers can only delete their own content.
// Principal can delete any content.
export const deleteContent = async (
  contentId: string,
  userId: string,
  userRole: string
): Promise<void> => {

  // Fetch first to get file_path and check ownership
  const result = await db.query<ContentWithUsers>(
    'SELECT * FROM content WHERE id = $1',
    [contentId]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Content not found' };
  }

  const content = result.rows[0]!;

  // Ownership check: teacher can only delete their own content
  if (userRole === 'teacher' && content.uploaded_by !== userId) {
    throw { status: 403, message: 'You can only delete your own content' };
  }

  // Delete from database first
  await db.query('DELETE FROM content WHERE id = $1', [contentId]);

  // Delete from S3
  const deleteParams = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: content.file_path, 
  };

  try {
    await s3.send(new DeleteObjectCommand(deleteParams));
  } catch (err) {
    console.error('Error deleting from S3:', err);
    // Continue even if S3 delete fails so DB stays in sync
  }
};
const contentService ={
    uploadContent,
    getMyContent,
    getAllContent,
    getContentById,
    deleteContent
}
export default contentService