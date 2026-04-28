import { z } from 'zod';

export const rejectSchema = z.object({
  rejection_reason: z
    .string({ required_error: 'rejection_reason is required' })
    .min(5, 'Rejection reason must be at least 5 characters')
    .max(500, 'Rejection reason too long'),
});

export type RejectInput = z.infer<typeof rejectSchema>;
