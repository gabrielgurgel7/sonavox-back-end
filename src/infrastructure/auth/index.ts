import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IHashService, ITokenService, TokenPair } from '../../application/ports';

export class BcryptHashService implements IHashService {
  private readonly saltRounds = 12;

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}

export class JwtTokenService implements ITokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;

  constructor() {
    this.accessSecret = process.env.JWT_SECRET || 'access_secret';
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh_secret';
    this.accessExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
  }

  generateTokens(payload: object): TokenPair {
    const accessToken = jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessExpiresIn as any,
    });
    const refreshToken = jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshExpiresIn as any,
    });
    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): any {
    return jwt.verify(token, this.accessSecret);
  }

  verifyRefreshToken(token: string): any {
    return jwt.verify(token, this.refreshSecret);
  }
}
