import { User } from '../entities/user.entity';

export interface IAuthService {
  register(registerDto: any): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }>;
  login(loginDto: any): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }>;
  refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>;
  logout(userId: string): Promise<void>;
  validateUser(email: string, password: string): Promise<User | null>;
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hashedPassword: string): Promise<boolean>;
}

export interface IUserRepository {
  create(userData: Partial<User>): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  update(id: string, userData: Partial<User>): Promise<User>;
  delete(id: string): Promise<boolean>;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}
