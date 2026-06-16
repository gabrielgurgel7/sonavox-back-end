import { Request, Response } from 'express';
import {
  GetUsersUseCase,
  GetUserByIdUseCase,
  UpdateProfileUseCase,
  DeleteUserUseCase,
} from '../../../application/use-cases/user/UserUseCases';
import { AuthRequest } from '../middlewares';

export class UserController {
  constructor(
    private getUsersUC: GetUsersUseCase,
    private getUserByIdUC: GetUserByIdUseCase,
    private updateProfileUC: UpdateProfileUseCase,
    private deleteUserUC: DeleteUserUseCase,
  ) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    const params = { page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 20, search: req.query.search as string };
    const result = await this.getUsersUC.execute(params);
    res.json({ success: true, data: result });
  };

  getById = async (req: AuthRequest, res: Response): Promise<void> => {
    const user = await this.getUserByIdUC.execute(req.params.id, req.user!.userId, req.user!.role === 'ADMIN');
    res.json({ success: true, data: user.toJSON() });
  };

  updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    const user = await this.updateProfileUC.execute(req.user!.userId, req.body, req.file);
    res.json({ success: true, data: user.toJSON() });
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.deleteUserUC.execute(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  };
}
