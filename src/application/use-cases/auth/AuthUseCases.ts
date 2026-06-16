import { v4 as uuid } from 'uuid';
import { User } from '../../../domain/entities/User';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IHashService, ITokenService, TokenPair } from '../../ports';
import { ConflictError, UnauthorizedError } from '../../../shared/errors/AppError';

// --- Register ---
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export class RegisterUseCase {
  constructor(
    private userRepository: IUserRepository,
    private hashService: IHashService,
    private tokenService: ITokenService,
  ) {}

  async execute(input: RegisterInput): Promise<{ user: object; tokens: TokenPair }> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) throw new ConflictError('Email already in use');

    const hashedPassword = await this.hashService.hash(input.password);
    const user = new User({
      id: uuid(),
      name: input.name,
      email: input.email,
      password: hashedPassword,
      role: 'CUSTOMER',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const tokens = this.tokenService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    user.setRefreshToken(tokens.refreshToken);
    await this.userRepository.save(user);

    return { user: user.toJSON(), tokens };
  }
}

// --- Login ---
export interface LoginInput {
  email: string;
  password: string;
}

export class LoginUseCase {
  constructor(
    private userRepository: IUserRepository,
    private hashService: IHashService,
    private tokenService: ITokenService,
  ) {}

  async execute(input: LoginInput): Promise<{ user: object; tokens: TokenPair }> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) throw new UnauthorizedError('Invalid credentials');

    const valid = await this.hashService.compare(input.password, user.password);
    if (!valid) throw new UnauthorizedError('Invalid credentials');

    const tokens = this.tokenService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    user.setRefreshToken(tokens.refreshToken);
    await this.userRepository.update(user);

    return { user: user.toJSON(), tokens };
  }
}

// --- Refresh Token ---
export class RefreshTokenUseCase {
  constructor(
    private userRepository: IUserRepository,
    private tokenService: ITokenService,
  ) {}

  async execute(refreshToken: string): Promise<TokenPair> {
    let payload: any;
    try {
      payload = this.tokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const user = await this.userRepository.findById(payload.userId);
    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const tokens = this.tokenService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    user.setRefreshToken(tokens.refreshToken);
    await this.userRepository.update(user);
    return tokens;
  }
}

// --- Logout ---
export class LogoutUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) return;
    user.setRefreshToken(undefined);
    await this.userRepository.update(user);
  }
}
