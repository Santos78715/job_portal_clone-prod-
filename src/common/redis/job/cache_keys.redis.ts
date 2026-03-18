import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CacheKeys {
  constructor() {}

  static jobsListVersionKey(): string {
    return 'jobs:v1:list:ver';
  }

  static normalizeJobsListParams(params: any) {
    const page = Number(params?.page);
    const limit = Number(params?.limit);
    const minSalary =
      params?.minSalary !== undefined ? Number(params.minSalary) : undefined;
    const maxSalary =
      params?.maxSalary !== undefined ? Number(params.maxSalary) : undefined;

    return {
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 20,
      location: params?.location
        ? String(params.location).toLowerCase()
        : 'all',
      jobType: params?.jobType ? String(params.jobType) : 'all',
      q: params?.q ? String(params.q).toLowerCase() : 'none',
      sortBy: params?.sortBy ? String(params.sortBy) : 'createdAt',
      sortOrder: params?.sortOrder ? String(params.sortOrder) : 'desc',
      minSalary:
        Number.isFinite(minSalary) && minSalary! >= 0 ? minSalary : 'none',
      maxSalary:
        Number.isFinite(maxSalary) && maxSalary! >= 0 ? maxSalary : 'none',
    };
  }

  static jobsListKey(version: string, params: any): string {
    const normalized = this.normalizeJobsListParams(params);
    const queryHash = this.hash(normalized);
    return `jobs:v1:list:${version}:${queryHash}`;
  }

  static stableStringify(obj: Record<string, any>): string {
    return JSON.stringify(
      Object.keys(obj)
        .sort()
        .reduce(
          (result, key) => {
            result[key] = obj[key];
            return result;
          },
          {} as Record<string, any>,
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
