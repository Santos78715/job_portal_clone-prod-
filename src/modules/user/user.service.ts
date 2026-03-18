import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordUtils } from 'src/utils/password';
import { ConflictException } from '@nestjs/common';
import { LoginUserDto } from './dto/login.dto';
import { Token } from 'src/utils/token';
import { RedisService } from 'src/common/redis/job/cache.service';
import type { Request, Response } from 'express';
import { CloudinaryService } from 'src/utils/cloudinary';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserCacheKeys } from 'src/common/redis/user/cache_keys.redis';
import { ListUsersDto } from './dto/list-users.dto';

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
  ) {}

  private async invalidateUsersListCache() {
    await this.redisService.incr(UserCacheKeys.listVersionKey());
  }

  async findAll(query: ListUsersDto = {}) {
    const page = Number.isFinite(Number(query.page)) ? Number(query.page) : 1;
    const limit = Number.isFinite(Number(query.limit))
      ? Number(query.limit)
      : 20;
    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);

    const versionKey = UserCacheKeys.listVersionKey();
    let version = await this.redisService.get(versionKey);
    if (!version) {
      version = '1';
      await this.redisService.set(versionKey, version);
    }

    const cacheKey = UserCacheKeys.listKey(version, {
      ...query,
      page,
      limit,
    });
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return cached as unknown;
      }
    }

    const allowedSortBy = [
      'createdAt',
      'updatedAt',
      'email',
      'firstname',
      'lastname',
    ] as const;
    const allowedSortOrder = ['asc', 'desc'] as const;
    const sortBy = allowedSortBy.includes(query.sortBy as any)
      ? (query.sortBy as (typeof allowedSortBy)[number])
      : 'createdAt';
    const sortOrder = allowedSortOrder.includes(query.sortOrder as any)
      ? (query.sortOrder as (typeof allowedSortOrder)[number])
      : 'desc';

    const where = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.companyId ? { companyId: Number(query.companyId) } : {}),
      ...(query.q
        ? {
            OR: [
              {
                email: {
                  contains: String(query.q),
                  mode: 'insensitive' as const,
                },
              },
              {
                firstname: {
                  contains: String(query.q),
                  mode: 'insensitive' as const,
                },
              },
              {
                lastname: {
                  contains: String(query.q),
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstname: true,
          lastname: true,
          role: true,
          phone: true,
          profileImage: true,
          description: true,
          bio: true,
          companyId: true,
          createdAt: true,
          updatedAt: true,
          company: {
            select: { id: true, registrationId: true, name: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: Math.max(1, limit),
      }),
    ]);

    const response = {
      data: users,
      meta: {
        page: Math.max(1, page),
        limit: Math.max(1, limit),
        total,
        totalPages: Math.ceil(total / Math.max(1, limit)),
        hasNextPage: skip + users.length < total,
      },
    };
    await this.redisService.set(cacheKey, JSON.stringify(response), 60);
    return response;
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        role: true,
        phone: true,
        profileImage: true,
        description: true,
        bio: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: { id: true, registrationId: true, name: true },
        },
        job: {
          select: {
            id: true,
            title: true,
            location: true,
            salary: true,
            jobType: true,
            isActive: true,
            companyId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        userSkills: {
          select: {
            id: true,
            skill: { select: { id: true, name: true } },
          },
        },
        education: {
          select: {
            id: true,
            name: true,
            startedAt: true,
            completedAt: true,
          },
        },
        experience: {
          select: {
            id: true,
            experience: true,
            startedAt: true,
            endedAt: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return { data: user };
  }

  async createUser(createUserDto: CreateUserDto) {
    try {
      // Hash the password
      const hashedPassword = await this.passwordUtils.hashpassword(
        createUserDto.password,
      );

      // Create user
      const userCreated = await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          firstname: createUserDto.firstname,
          lastname: createUserDto.lastname,
          password: hashedPassword,
          phone: createUserDto.phone,
          role: createUserDto.role,
          profileImage: createUserDto.profileImage,
          description: createUserDto.description,
          bio: createUserDto.bio,
          companyId: createUserDto.companyId,
        },
        select: {
          id: true,
          email: true,
          firstname: true,
          lastname: true,
          role: true,
          phone: true,
          profileImage: true,
          description: true,
          bio: true,
          companyId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await this.invalidateUsersListCache();
      return userCreated;
    } catch (error) {
      // Handle unique constraint violation
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

  async updateUser(updateUserDto: UpdateUserDto) {
    try {
      const { email, password, ...rest } = updateUserDto;

      const nextPassword =
        password !== undefined
          ? await this.passwordUtils.hashpassword(password)
          : undefined;

      const updatedUser = await this.prisma.user.update({
        where: {
          email,
        },
        data: {
          ...rest,
          ...(nextPassword ? { password: nextPassword } : {}),
        },
        select: {
          id: true,
          email: true,
          firstname: true,
          lastname: true,
          role: true,
          phone: true,
          profileImage: true,
          description: true,
          bio: true,
          companyId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      await this.invalidateUsersListCache();
      return {
        message: 'User has been updated successfully !',
        id: updatedUser.id,
        data: updatedUser,
      };
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: unknown }).code === 'P2025'
      ) {
        throw new NotFoundException('User does not exist with this email');
      }
      throw new InternalServerErrorException('Updating the user failed');
    }
  }

  async remove(id: number) {
    try {
      const deleted = await this.prisma.user.delete({
        where: { id },
        select: { id: true },
      });
      await this.invalidateUsersListCache();
      return { message: 'User deleted successfully', id: deleted.id };
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: unknown }).code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
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
