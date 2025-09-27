import { HttpException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';
import { JwtService } from '@nestjs/jwt';
import refreshJwtConfig from './config/refresh-jwt.config';
import type { ConfigType } from '@nestjs/config';
import * as argon2 from 'argon2';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService, 
    private jwtService: JwtService, 
    @Inject(refreshJwtConfig.KEY) private refreshJwtConfiguration: ConfigType<typeof refreshJwtConfig>, 
  ) {}
  
  async generateTokens(userId: number, payload: object) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload), 
      this.jwtService.signAsync(payload, this.refreshJwtConfiguration), 
    ]);

    return { userId, accessToken, refreshToken };
  }

  async findByCredentials(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user)
      throw new NotFoundException('Invalid credentials');

    const [salt, storedHash] = user.hashedPassword;
    const hashedPassword = await scrypt(salt, password, 32) as Buffer;

    if (storedHash !== hashedPassword.toString('hex'))
      throw new HttpException('Invalid credentials', 400);

    return user;
  }

  async validateRefreshToken(userId: number, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.hashedRefreshToken)
      throw new UnauthorizedException('Unauthorized');

    const areEqual = await argon2.verify(user.hashedRefreshToken, refreshToken!);    
    if (!areEqual)
      return new UnauthorizedException('Unauthorized');

    return { userId };
  }

  async updateHashedRefreshToken(userId: number, hashedRefreshToken: string | null) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
      throw new NotFoundException('No user found');

    return await this.prisma.user.update({
      where: { id: user.id }, 
      data: { hashedRefreshToken } 
    });
  }

  async refreshTokens(userId: number, payload: object) {
    const { accessToken, refreshToken } = await this.generateTokens(userId, payload);
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.updateHashedRefreshToken(userId, hashedRefreshToken);
    return { userId, accessToken, refreshToken };
  }

  async logOut(userId: number) {
    return await this.updateHashedRefreshToken(userId, null);
  }
}
