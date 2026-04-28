import { z } from 'zod';

export const uploadContentSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(1, 'Title cannot be empty')
    .max(255, 'Title is too long'),

  subject: z
    .string({ required_error: 'Subject is required' })
    .min(1, 'Subject cannot be empty')
    .max(100, 'Subject name is too long')
    .transform((val) => val.toLowerCase().trim()), 

  description: z
    .string()
    .max(1000, 'Description too long')
    .optional(),

  start_time: z
    .string()
    .datetime({ message: 'start_time must be a valid ISO datetime e.g. 2025-01-27T09:00:00Z' })
    .optional(),

  end_time: z
    .string()
    .datetime({ message: 'end_time must be a valid ISO datetime e.g. 2025-01-27T17:00:00Z' })
    .optional(),

  rotation_duration: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 5)) // default 5 minutes
    .pipe(
      z.number()
        .int('rotation_duration must be a whole number')
        .min(1, 'rotation_duration must be at least 1 minute')
        .max(1440, 'rotation_duration cannot exceed 24 hours (1440 minutes)')
    ),
}).refine(
  // if both provided, end must be after start
  (data) => {
    if (data.start_time && data.end_time) {
      return new Date(data.end_time) > new Date(data.start_time);
    }
    return true; 
  },
  { message: 'end_time must be after start_time', path: ['end_time'] }
).refine(
    //both or neither
  (data) => {
    const hasStart = !!data.start_time;
    const hasEnd   = !!data.end_time;
    return hasStart === hasEnd; 
  },
  { message: 'Provide both start_time and end_time, or neither', path: ['start_time'] }
);

export const listContentQuerySchema = z.object({
  status: z
    .enum(['pending', 'approved', 'rejected'])
    .optional(),

  subject: z
    .string()
    .optional()
    .transform((val) => val?.toLowerCase().trim()),

  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1)),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(100)),
});

export type UploadContentInput = z.infer<typeof uploadContentSchema>;
export type ListContentQuery   = z.infer<typeof listContentQuerySchema>;
