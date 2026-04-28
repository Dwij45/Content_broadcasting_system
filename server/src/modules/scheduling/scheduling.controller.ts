import type { Request, Response } from 'express';
import broadcastService from './scheduling.services.js';

const getLive = async (req: Request, res: Response) => {
    try {
        const teacherId = req.params.teacherId as string;
    const subject = typeof req.query.subject === 'string'
      ? req.query.subject.toLowerCase().trim()
      : undefined;

    const result = await broadcastService.getLiveContent(teacherId, subject);

    if (result.active_content) {
        return res.status(200).json({
            success: true,
            data: result,
        });
    }

    return res.status(404).json({
        success: false,
        message: result.message || 'No content found',
    });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get live content' });
    }
}
export { getLive };
const broadcastController = {
    getLive
}
export default broadcastController