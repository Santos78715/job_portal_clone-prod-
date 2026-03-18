import * as crypto from 'crypto';

export class UserCacheKeys {
  static listVersionKey(): string {
    return 'users:v1:list:ver';
  }

  static normalizeListParams(params: unknown) {
    const obj: Record<string, unknown> =
      params && typeof params === 'object'
        ? (params as Record<string, unknown>)
        : {};

    const page = Number(obj.page);
    const limit = Number(obj.limit);
    const companyId =
      obj.companyId !== undefined ? Number(obj.companyId) : undefined;

    const q =
      typeof obj.q === 'string' && obj.q.trim().length > 0
        ? obj.q.toLowerCase()
        : 'none';
    const role = typeof obj.role === 'string' ? obj.role : 'all';
    const sortBy = typeof obj.sortBy === 'string' ? obj.sortBy : 'createdAt';
    const sortOrder =
      typeof obj.sortOrder === 'string' ? obj.sortOrder : 'desc';

    return {
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 20,
      q,
      role,
      companyId:
        Number.isFinite(companyId) && companyId! > 0 ? companyId : 'all',
      sortBy,
      sortOrder,
    };
  }

  static listKey(version: string, params: unknown): string {
    const normalized = this.normalizeListParams(params);
    const queryHash = this.hash(normalized);
    return `users:v1:list:${version}:${queryHash}`;
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
      .createHash('md5')
      .update(this.stableStringify(input))
      .digest('hex');
  }
}
