import { db } from '../../config/db.js';
import type { ContentWithUsers } from '../../types/index.js';

 const approveContent = async (
  contentId: string,
  principalId: string
): Promise<ContentWithUsers> => {

  const existing = await db.query<ContentWithUsers>(
    'SELECT * FROM content WHERE id = $1',
    [contentId]
  );

  if (existing.rows.length === 0) {
    throw { status: 404, message: 'Content not found' };
  }

  if (existing.rows[0]?.status === 'approved') {
    throw { status: 400, message: 'Content is already approved' };
  }

    await db.query(
    `UPDATE content
     SET
       status           = 'approved',
       approved_by      = $1,
       approved_at      = NOW(),
       rejection_reason = NULL,
       updated_at       = NOW()
     WHERE id = $2`,
    [principalId, contentId]
  );

  return getContentWithUsers(contentId);
};
const rejectContent = async (
  contentId: string,
  principalId: string,
  rejectionReason: string
): Promise<ContentWithUsers> => {

  const existing = await db.query<ContentWithUsers>(
    'SELECT * FROM content WHERE id = $1',
    [contentId]
  );

  if (existing.rows.length === 0) {
    throw { status: 404, message: 'Content not found' };
  }

  if (existing.rows[0]?.status === 'rejected') {
    throw { status: 400, message: 'Content is already rejected' };
  }

  await db.query(
    `UPDATE content
     SET
       status           = 'rejected',
       approved_by      = $1,
       approved_at      = NOW(),
       rejection_reason = $2,
       updated_at       = NOW()
     WHERE id = $3`,
    [principalId, rejectionReason, contentId]
  );

  return getContentWithUsers(contentId);
};

const getContentWithUsers = async (contentId: string): Promise<ContentWithUsers> => {
  const result = await db.query<ContentWithUsers>(
    `SELECT
       c.*,
       u.name AS uploader_name,
       p.name AS approver_name
     FROM content c
     LEFT JOIN users u ON c.uploaded_by = u.id
     LEFT JOIN users p ON c.approved_by = p.id
     WHERE c.id = $1`,
    [contentId]
  );
  return result.rows[0]!;
};
const approvalService = {
    approveContent,
    rejectContent
}
export default approvalService;