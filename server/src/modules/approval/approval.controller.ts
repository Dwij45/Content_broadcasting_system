import type { Request, Response } from 'express';
import approvalService from './approval.services.js';
import { rejectSchema } from './approval.schema.js';

const approveContent = async (req:Request, res:Response)=>{
    try{
        const contentId = req.params.id as string;
        const userId = req.user?.id as string;
        const content = await approvalService.approveContent(contentId, userId);
        res.status(200).json({success:true, message:'Content approved successfully', data:content});
    }catch(error){
        res.status(500).json({success:false, message:'Failed to approve content', error: (error as any).message});
    }
}
const rejectContent = async (req:Request, res:Response)=>{
    const parsed = rejectSchema.safeParse(req.body);
    if(!parsed.success){
        res.status(400).json({success:false, message:'Invalid request', error:parsed.error.errors});
        return;
    }
    try {
    const contentId = req.params.id as string;
    const userId = req.user?.id as string;
    const content = await approvalService.rejectContent(
      contentId,
      userId,
      parsed.data.rejection_reason
    );
    res.status(200).json({success:true, message:'Content rejected successfully', data:content});
  } catch (err) {
    res.status(500).json({success:false, message:'Failed to reject content', error: (err as any).message});
  }
    
}
const approvalController = {
    approveContent,
    rejectContent
}
export default approvalController;