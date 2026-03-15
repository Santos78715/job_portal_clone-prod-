import { Injectable } from '@nestjs/common';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

type TokenType = 'access' | 'refresh';

type JwtHeader = {
  alg: 'HS256';
  typ: 'JWT';
};

export type AuthTokenPayload = {
  sub: number;
  email: string;
  role: string;
  tokenType: TokenType;
  sid?: string;
  jti: string;
  iat: number;
  exp: number;
};

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function base64UrlEncode(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecodeToBuffer(input: string): Buffer {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(padLength);
  return Buffer.from(padded, 'base64');
}

function safeJsonParse<T>(buf: Buffer): T | null {
  try {
    return JSON.parse(buf.toString('utf8')) as T;
  } catch {
    return null;
  }
}

function constantTimeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function parseDurationSeconds(
  value: string | undefined,
  fallbackSeconds: number,
): number {
  if (!value) return fallbackSeconds;

  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return Math.max(1, Number(trimmed));

  const match = /^(\d+)\s*([smhd])$/.exec(trimmed);
  if (!match) return fallbackSeconds;

  const amount = Math.max(1, Number(match[1]));
  const unit = match[2] as 's' | 'm' | 'h' | 'd';
  const multiplier =
    unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400;
  return amount * multiplier;
}

function getSecret(envName: string): string {
  const raw = process.env[envName];
  if (raw && raw.trim().length > 0) return raw;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${envName} is required in production`);
  }

  return `dev-${envName}-change-me`;
}

function signHs256(data: string, secret: string): string {
  const sig = createHmac('sha256', secret).update(data).digest();
  return base64UrlEncode(sig);
}

function buildJwt(
  payload: Omit<AuthTokenPayload, 'iat' | 'exp' | 'jti'>,
  secret: string,
  ttlSeconds: number,
): string {
  const header: JwtHeader = { alg: 'HS256', typ: 'JWT' };
  const iat = nowSeconds();
  const exp = iat + Math.max(1, ttlSeconds);
  const fullPayload: AuthTokenPayload = {
    ...payload,
    iat,
    exp,
    jti: randomUUID(),
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const toSign = `${encodedHeader}.${encodedPayload}`;
  const signature = signHs256(toSign, secret);
  return `${toSign}.${signature}`;
}

function verifyJwt(
  token: string,
  secret: string,
  expectedType: TokenType,
): { valid: true; payload: AuthTokenPayload } | { valid: false } {
  const parts = token.split('.');
  if (parts.length !== 3) return { valid: false };

  const [encodedHeader, encodedPayload, signature] = parts;
  const toSign = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = signHs256(toSign, secret);
  if (!constantTimeEqual(signature, expectedSignature)) return { valid: false };

  const header = safeJsonParse<JwtHeader>(
    base64UrlDecodeToBuffer(encodedHeader),
  );
  if (!header || header.alg !== 'HS256' || header.typ !== 'JWT')
    return { valid: false };

  const payload = safeJsonParse<AuthTokenPayload>(
    base64UrlDecodeToBuffer(encodedPayload),
  );
  if (!payload) return { valid: false };

  if (payload.tokenType !== expectedType) return { valid: false };
  if (typeof payload.sub !== 'number' || !Number.isFinite(payload.sub))
    return { valid: false };
  if (typeof payload.email !== 'string' || payload.email.length === 0)
    return { valid: false };
  if (typeof payload.role !== 'string' || payload.role.length === 0)
    return { valid: false };
  if (typeof payload.iat !== 'number' || typeof payload.exp !== 'number')
    return { valid: false };

  const skewSeconds = parseDurationSeconds(process.env.CLOCK_SKEW_SECONDS, 5);
  const now = nowSeconds();
  if (payload.iat > now + skewSeconds) return { valid: false };
  if (payload.exp <= now - skewSeconds) return { valid: false };

  return { valid: true, payload };
}

@Injectable()
export class Token {
  generateAccessToken(
    userId: number,
    email: string,
    role: string,
    sid?: string,
  ): string {
    const secret = getSecret('ACCESS_TOKEN_SECRET');
    const ttl = parseDurationSeconds(
      process.env.ACCESS_TOKEN_EXPIRES_IN,
      15 * 60,
    );
    return buildJwt(
      { sub: userId, email, role, tokenType: 'access', sid },
      secret,
      ttl,
    );
  }

  validateAccessToken(
    token: string,
  ): { valid: true; payload: AuthTokenPayload } | { valid: false } {
    const secret = getSecret('ACCESS_TOKEN_SECRET');
    return verifyJwt(token, secret, 'access');
  }

  generateRefreshToken(userId: number, email: string, role: string): string {
    const secret = getSecret('REFRESH_TOKEN_SECRET');
    const ttl = parseDurationSeconds(
      process.env.REFRESH_TOKEN_EXPIRES_IN,
      7 * 24 * 60 * 60,
    );
    return buildJwt(
      { sub: userId, email, role, tokenType: 'refresh' },
      secret,
      ttl,
    );
  }

  validateRefreshToken(token: string):
    | {
        valid: true;
        payload: AuthTokenPayload;
      }
    | {
        valid: false;
      } {
    const secret = getSecret('REFRESH_TOKEN_SECRET');
    return verifyJwt(token, secret, 'refresh');
  }
}
