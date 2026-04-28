import z from "zod";

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long'),

  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .toLowerCase(), // auto-lowercase before saving

  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password too long'),

  role: z.enum(['principal', 'teacher'], {
    required_error: 'Role must be principal or teacher',
  }),
});
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .toLowerCase(),

  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput    = z.infer<typeof loginSchema>;        