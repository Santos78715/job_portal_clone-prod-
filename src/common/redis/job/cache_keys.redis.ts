import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CacheKeys {
  constructor() {}

  static jobsListVersionKey(): string {
    return 'jobs:v1:list:ver';
  }

  static normalizeJobsListParams(params: unknown) {
    const obj: Record<string, unknown> =
      params && typeof params === 'object'
        ? (params as Record<string, unknown>)
        : {};

    const page = Number(obj.page);
    const limit = Number(obj.limit);
    const minSalary =
      obj.minSalary !== undefined ? Number(obj.minSalary) : undefined;
    const maxSalary =
      obj.maxSalary !== undefined ? Number(obj.maxSalary) : undefined;

    const location =
      typeof obj.location === 'string' && obj.location.trim().length > 0
        ? obj.location.toLowerCase()
        : 'all';
    const jobType = typeof obj.jobType === 'string' ? obj.jobType : 'all';
    const q =
      typeof obj.q === 'string' && obj.q.trim().length > 0
        ? obj.q.toLowerCase()
        : 'none';
    const sortBy = typeof obj.sortBy === 'string' ? obj.sortBy : 'createdAt';
    const sortOrder =
      typeof obj.sortOrder === 'string' ? obj.sortOrder : 'desc';

    return {
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 20,
      location,
      jobType,
      q,
      sortBy,
      sortOrder,
      minSalary:
        Number.isFinite(minSalary) && minSalary! >= 0 ? minSalary : 'none',
      maxSalary:
        Number.isFinite(maxSalary) && maxSalary! >= 0 ? maxSalary : 'none',
    };
  }

  static jobsListKey(version: string, params: unknown): string {
    const normalized = this.normalizeJobsListParams(params);
    const queryHash = this.hash(normalized);
    return `jobs:v1:list:${version}:${queryHash}`;
  }

  static stableStringify(obj: object): string {
    const record = obj as Record<string, unknown>;
    return JSON.stringify(
      Object.keys(record)
        .sort()
        .reduce(
          (result, key) => {
            result[key] = record[key];
            return result;
          },
          {} as Record<string, unknown>,
        ),
    );
  }

  static hash(input: object): string {
    return crypto
      .createHash('md5') // fast + enough for cache keys
      .update(this.stableStringify(input))
      .digest('hex');
  }
}
