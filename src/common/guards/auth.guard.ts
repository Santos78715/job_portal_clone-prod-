import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { RedisService } from 'src/common/redis/redis.service';
import { Token } from 'src/utils/token';

type RequestWithCookies = Request & {
  cookies: Record<string, string | undefined>;
  user?: unknown;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private tokenUtils: Token,
    private redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithCookies>();
    const cookies = request.cookies as unknown as Record<
      string,
      string | undefined
    >;
    const accessToken = cookies.access_token;

    if (!accessToken) {
      throw new UnauthorizedException('Missing access token');
    }

    const isValid = this.tokenUtils.validateAccessToken(accessToken);
    if (!isValid.valid) {
      throw new UnauthorizedException('Invalid access token');
    }

    if (!isValid.payload.sid) {
      throw new UnauthorizedException('Session missing');
    }

    const sessionKey = this.redisService.refreshKey(
      isValid.payload.sub,
      isValid.payload.sid,
    );
    const sessionExists = await this.redisService.get(sessionKey);
    if (!sessionExists) {
      throw new UnauthorizedException('Session expired');
    }

    request.user = isValid.payload;
    return true;
  }
}
