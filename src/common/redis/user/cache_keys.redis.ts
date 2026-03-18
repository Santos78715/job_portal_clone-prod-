import * as crypto from 'crypto';

export class UserCacheKeys {
  static listVersionKey(): string {
    return 'users:v1:list:ver';
  }

  static normalizeListParams(params: any) {
    const page = Number(params?.page);
    const limit = Number(params?.limit);
    const companyId = params?.companyId !== undefined ? Number(params.companyId) : undefined;

    return {
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 20,
      q: params?.q ? String(params.q).toLowerCase() : 'none',
      role: params?.role ? String(params.role) : 'all',
      companyId:
        Number.isFinite(companyId) && companyId! > 0 ? companyId : 'all',
      sortBy: params?.sortBy ? String(params.sortBy) : 'createdAt',
      sortOrder: params?.sortOrder ? String(params.sortOrder) : 'desc',
    };
  }

  static listKey(version: string, params: any): string {
    const normalized = this.normalizeListParams(params);
    const queryHash = this.hash(normalized);
    return `users:v1:list:${version}:${queryHash}`;
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
      .createHash('md5')
      .update(this.stableStringify(input))
      .digest('hex');
  }
}

