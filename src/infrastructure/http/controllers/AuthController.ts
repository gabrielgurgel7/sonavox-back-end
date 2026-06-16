import { Request, Response } from 'express';
import { z } from 'zod';
import {
  RegisterUseCase,
  LoginUseCase,
  RefreshTokenUseCase,
  LogoutUseCase,
} from '../../../application/use-cases/auth/AuthUseCases';
import { AuthRequest } from '../middlewares';

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});
console.log('Register schema defined:', registerSchema.shape);
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export class AuthController {
  constructor(
    private registerUC: RegisterUseCase,
    private loginUC: LoginUseCase,
    private refreshUC: RefreshTokenUseCase,
    private logoutUC: LogoutUseCase,
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const data = registerSchema.parse(req.body);
    const result = await this.registerUC.execute(data);
    res.status(201).json({ success: true, data: result });
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const data = loginSchema.parse(req.body);
    const result = await this.loginUC.execute(data);
    res.json({ success: true, data: result });
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;
    if (!refreshToken) { res.status(400).json({ success: false, message: 'Refresh token required' }); return; }
    const tokens = await this.refreshUC.execute(refreshToken);
    res.json({ success: true, data: { tokens } });
  };

  logout = async (req: AuthRequest, res: Response): Promise<void> => {
    await this.logoutUC.execute(req.user!.userId);
    res.json({ success: true, message: 'Logged out successfully' });
  };

  me = async (req: AuthRequest, res: Response): Promise<void> => {
    res.json({ success: true, data: req.user });
  };
}
