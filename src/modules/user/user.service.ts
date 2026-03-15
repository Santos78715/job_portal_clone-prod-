import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordUtils } from 'src/utils/password';
import { ConflictException } from '@nestjs/common';
import { LoginUserDto } from './dto/login.dto';
import { Token } from 'src/utils/token';
import { RedisService } from 'src/common/redis/redis.service';
import type { Request, Response } from 'express';
import { CloudinaryService } from 'src/utils/cloudinary';

type RequestWithCookies = Request & {
  cookies: Record<string, string | undefined>;
};

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private passwordUtils: PasswordUtils,
    private tokenUtils: Token,
    private redisService: RedisService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    try {
      const userPassword = await this.passwordUtils.hashpassword(
        createUserDto.password,
      );
      const userCreated = await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          firstname: createUserDto.firstname,
          password: userPassword,
          lastname: createUserDto.lastname,
          phone: createUserDto.phone,
          role: createUserDto.role,
        },
        select: {
          id: true,
          email: true,
          firstname: true,
          lastname: true,
          role: true,
          phone: true,
        },
      });
      return userCreated;
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: unknown }).code === 'P2002'
      ) {
        throw new ConflictException('Email already exists');
      }

      throw error;
    }
  }

  async loginUser(loginUserDto: LoginUserDto, response: Response) {
    const userExists = await this.prisma.user.findUnique({
      where: {
        email: loginUserDto.email,
      },
      select: {
        id: true,
        password: true,
        role: true,
      },
    });

    if (!userExists) {
      throw new ConflictException('User does not exist with this email');
    }

    const isPasswordValid = await this.passwordUtils.comparePassword(
      loginUserDto.password,
      userExists.password,
    );

    if (!isPasswordValid) {
      throw new ConflictException('Invalid password');
    }

    const refresh_token = this.tokenUtils.generateRefreshToken(
      userExists.id,
      loginUserDto.email,
      userExists.role,
    );

    if (!refresh_token) {
      throw new ConflictException('Failed to generate refresh token');
    }

    const refreshVerified = this.tokenUtils.validateRefreshToken(refresh_token);
    if (!refreshVerified.valid)
      throw new UnauthorizedException('Failed to mint refresh token');

    const sid = refreshVerified.payload.jti;

    const access_token = this.tokenUtils.generateAccessToken(
      userExists.id,
      loginUserDto.email,
      userExists.role,
      sid,
    );

    const accessVerified = this.tokenUtils.validateAccessToken(access_token);
    if (!accessVerified.valid) {
      throw new UnauthorizedException('Failed to mint access token');
    }

    // allowlist refresh jti in Redis for its remaining lifetime
    const ttlSeconds = Math.max(
      1,
      refreshVerified.payload.exp - Math.floor(Date.now() / 1000),
    );
    await this.redisService.set(
      this.redisService.refreshKey(userExists.id, refreshVerified.payload.jti),
      '1',
      ttlSeconds,
    );

    const cookieBase = {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };

    response.cookie('access_token', access_token, {
      ...cookieBase,
      maxAge:
        Math.max(
          1,
          accessVerified.payload.exp - Math.floor(Date.now() / 1000),
        ) * 1000,
    });
    response.cookie('refresh_token', refresh_token, {
      ...cookieBase,
      maxAge:
        Math.max(
          1,
          refreshVerified.payload.exp - Math.floor(Date.now() / 1000),
        ) * 1000,
    });

    return { message: 'Login successful' };
  }

  async refresh(req: RequestWithCookies, res: Response) {
    const cookies = req.cookies as unknown as Record<
      string,
      string | undefined
    >;
    const refreshToken = cookies.refresh_token;
    if (!refreshToken) throw new UnauthorizedException('Missing refresh token');

    const verified = this.tokenUtils.validateRefreshToken(refreshToken);
    if (!verified.valid)
      throw new UnauthorizedException('Invalid refresh token');

    const { sub: userId, email, role, jti } = verified.payload;

    // session check (this is the important Redis part)
    const allowed = await this.redisService.get(
      this.redisService.refreshKey(userId, jti),
    );
    if (!allowed) throw new UnauthorizedException('Session expired');

    // rotate refresh: delete old jti, mint new, store new jti
    await this.redisService.del(this.redisService.refreshKey(userId, jti));

    const newRefresh = this.tokenUtils.generateRefreshToken(
      userId,
      email,
      role,
    );

    const newRefreshVerified = this.tokenUtils.validateRefreshToken(newRefresh);
    if (!newRefreshVerified.valid)
      throw new UnauthorizedException('Failed to rotate refresh token');

    const ttlSeconds = Math.max(
      1,
      newRefreshVerified.payload.exp - Math.floor(Date.now() / 1000),
    );
    await this.redisService.set(
      this.redisService.refreshKey(userId, newRefreshVerified.payload.jti),
      '1',
      ttlSeconds,
    );

    const rotatedSid = newRefreshVerified.payload.jti;
    const newAccess = this.tokenUtils.generateAccessToken(
      userId,
      email,
      role,
      rotatedSid,
    );
    const newAccessVerified = this.tokenUtils.validateAccessToken(newAccess);
    if (!newAccessVerified.valid) {
      throw new UnauthorizedException('Failed to mint access token');
    }

    const cookieBase = {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };

    res.cookie('access_token', newAccess, {
      ...cookieBase,
      maxAge:
        Math.max(
          1,
          newAccessVerified.payload.exp - Math.floor(Date.now() / 1000),
        ) * 1000,
    });
    res.cookie('refresh_token', newRefresh, {
      ...cookieBase,
      maxAge:
        Math.max(
          1,
          newRefreshVerified.payload.exp - Math.floor(Date.now() / 1000),
        ) * 1000,
    });

    return { message: 'Refreshed' };
  }

  async logOut(req: RequestWithCookies, res: Response) {
    const cookies = req.cookies as unknown as Record<
      string,
      string | undefined
    >;
    const refreshToken = cookies.refresh_token;
    if (refreshToken) {
      const verified = this.tokenUtils.validateRefreshToken(refreshToken);
      if (verified.valid) {
        const { sub: userId, jti } = verified.payload;
        await this.redisService.del(this.redisService.refreshKey(userId, jti));
      }
    }

    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });

    return { message: 'Logged out' };
  }
}
