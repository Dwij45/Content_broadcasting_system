import type { Request, Response } from "express";
import authService from "./auth.services.js";
import { registerSchema, loginSchema } from "./auth.schema.js";

const register = async (req: Request, res: Response): Promise<void> => {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    const messages = parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
    res.status(400).json({ message: messages.join(' | ') });
    return;
  }

  try {
    const { user, token } = await authService.register(parsed.data);
    res.status(201).json({ message: 'User registered successfully', user, token });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(500).json({ message });
  }
};

const login = async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    const messages = parsed.error.issues.map((e) => e.message);
    res.status(400).json({ message: messages.join(' | ') });
    return;
  }

  try {
    const { user, token } = await authService.login(parsed.data);
    res.status(200).json({ message: 'Login successful', user, token });
  } catch (error: unknown) {
    console.error('[login]', error);
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(500).json({ message });
  }
};
const getme = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await authService.getProfile(req.user!.id);

    res.status(200).json({ user });

  } catch (error: unknown) {

    console.error('[getme]', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch profile';
    res.status(500).json({ message });
  }
};
const authController = {
    register,
    login,
    getme
}
export default authController