import type { Request, Response } from "express";

import { uploadContentSchema, listContentQuerySchema } from './content.schema.js';
import contentService from "./content.services.js";
export const uploadContent = async (req: Request, res: Response):Promise<void> => {
    if(!req.file){
        res.status(400).json({message: "file is required"})
        return;
    }
    const parsed = uploadContentSchema.safeParse(req.body);
    if(!parsed.success){
        res.status(400).json({message: "invalid data"})
        return;
    }

    try{
        const content = await contentService.uploadContent(req, parsed.data);
        res.status(201).json({message: "content uploaded successfully", content});
    }catch(error){
        console.log(error);
        res.status(500).json({message: "internal server error"});
    }
}

export const getMyContent = async (req: Request, res: Response):Promise<void> => {
     const parsed = listContentQuerySchema.safeParse(req.query);
     if(!parsed.success){
        res.status(400).json({message: "invalid data"})
        return;
     }
    try{
        const userId = req.user?.id as string;
        const content = await contentService.getMyContent(userId, parsed.data);
        res.status(200).json({message: "content fetched successfully", content});
    }catch(error){
        console.log(error);
        res.status(500).json({message: "internal server error"});
    }
}

export const getAllContent = async (req: Request, res: Response):Promise<void> => {
    const parsed = listContentQuerySchema.safeParse(req.query);
     if(!parsed.success){
        res.status(400).json({message: "invalid data"})
        return;
     }

    try{
         const teacher_id = typeof req.query.teacher_id === 'string'
      ? req.query.teacher_id
      : undefined;

    const queryParams: any = { ...parsed.data };
    if (teacher_id) queryParams.teacher_id = teacher_id;

    const result = await contentService.getAllContent(queryParams);
        res.status(200).json({message: "content fetched successfully", result});
    }catch(error){
        console.log(error);
        res.status(500).json({message: "internal server error"});
    }
}

export const getContentById = async (req: Request, res: Response):Promise<void> => {
    try{
        const contentId = req.params.id as string;
        const content = await contentService.getContentById(contentId);

        if (req.user?.role === 'teacher' && content.uploaded_by !== req.user?.id) {
            throw new Error("You do not have access to this content");
        }
        
        res.status(200).json({message: "content fetched successfully", content});
    }
    catch(error){
        console.log(error);
        res.status(500).json({message: "internal server error"});
    }
}

export const deleteContent = async (req: Request, res: Response):Promise<void> => {
    try{
        const contentId = req.params.id as string;
        const userId = req.user?.id as string;
        const userRole = req.user?.role as string;
        const content = await contentService.deleteContent(contentId, userId, userRole);
        res.status(200).json({message: "content deleted successfully", content});
    }catch(error){
        console.log(error);
        res.status(500).json({message: "internal server error"});
    }
}