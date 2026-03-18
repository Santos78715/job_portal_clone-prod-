import { SetMetadata } from '@nestjs/common';

export const PRESIGN_POLICY_KEY = 'presign_policy';

export type PresignPolicy = {
  folder: string;
  maxBytes: number;
  allowedMimeTypes: string[];
  expiresInSeconds?: number;
};

export const PresignPolicy = (policy: PresignPolicy) =>
  SetMetadata(PRESIGN_POLICY_KEY, policy);
