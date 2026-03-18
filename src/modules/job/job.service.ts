import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobType } from '@prisma/client';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ListJobsDto } from './dto/list-jobs.dto';
import { RedisService } from 'src/common/redis/job/cache.service';
import { CacheKeys } from 'src/common/redis/job/cache_keys.redis';

@Injectable()
export class JobService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async create(createJobDto: CreateJobDto, userId: number) {
    const job = await this.prisma.job.create({
      data: {
        title: createJobDto.title,
        description: createJobDto.description,
        location: createJobDto.location,
        salary: createJobDto.salary,
        jobType: createJobDto.jobType,
        isActive: createJobDto.isActive ?? true,
        companyId: createJobDto.companyId,
        userId,
      },
      include: {
        company: { select: { id: true, name: true, registrationId: true } },
        user: {
          select: {
            id: true,
            email: true,
            firstname: true,
            lastname: true,
            role: true,
          },
        },
      },
    });

    await this.redisService.incr(CacheKeys.jobsListVersionKey());
    return { message: 'Job created successfully', id: job.id, data: job };
  }

  async list(query: ListJobsDto) {
    const toNumber = (value: unknown) =>
      value === undefined || value === null
        ? undefined
        : typeof value === 'number'
          ? value
          : Number(value);

    const pageNum = toNumber(query.page);
    const limitNum = toNumber(query.limit);
    const minSalaryNum = toNumber(query.minSalary);
    const maxSalaryNum = toNumber(query.maxSalary);

    const page =
      Number.isFinite(pageNum) && (pageNum as number) >= 1
        ? Math.floor(pageNum as number)
        : 1;
    const limit =
      Number.isFinite(limitNum) && (limitNum as number) >= 1
        ? Math.min(100, Math.floor(limitNum as number))
        : 20;
    const skip = (page - 1) * limit;

    const minSalary =
      Number.isFinite(minSalaryNum) && (minSalaryNum as number) >= 0
        ? (minSalaryNum as number)
        : undefined;
    const maxSalary =
      Number.isFinite(maxSalaryNum) && (maxSalaryNum as number) >= 0
        ? (maxSalaryNum as number)
        : undefined;

    if (minSalary !== undefined && maxSalary !== undefined) {
      if (minSalary > maxSalary) {
        throw new BadRequestException(
          'minSalary cannot be greater than maxSalary',
        );
      }
    }

    const allowedSortBy = [
      'createdAt',
      'updatedAt',
      'salary',
      'title',
    ] as const;
    const allowedSortOrder = ['asc', 'desc'] as const;

    const sortBy = allowedSortBy.includes(query.sortBy as any)
      ? (query.sortBy as (typeof allowedSortBy)[number])
      : 'createdAt';
    const sortOrder = allowedSortOrder.includes(query.sortOrder as any)
      ? (query.sortOrder as (typeof allowedSortOrder)[number])
      : 'desc';

    const jobType =
      query.jobType && Object.values(JobType).includes(query.jobType as any)
        ? (query.jobType as JobType)
        : undefined;

    const normalizedForKey = CacheKeys.normalizeJobsListParams({
      ...query,
      page,
      limit,
      minSalary,
      maxSalary,
      sortBy,
      sortOrder,
      jobType,
    });
    const versionKey = CacheKeys.jobsListVersionKey();
    let version = await this.redisService.get(versionKey);
    if (!version) {
      version = '1';
      await this.redisService.set(versionKey, version);
    }

    const cacheKey = CacheKeys.jobsListKey(version, normalizedForKey);
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return cached as unknown;
      }
    }

    const where = {
      isActive: true,
      ...(query.location
        ? {
            location: {
              contains: String(query.location),
              mode: 'insensitive' as const,
            },
          }
        : {}),
      ...(jobType ? { jobType } : {}),
      ...(minSalary !== undefined || maxSalary !== undefined
        ? {
            salary: {
              ...(minSalary !== undefined ? { gte: minSalary } : {}),
              ...(maxSalary !== undefined ? { lte: maxSalary } : {}),
            },
          }
        : {}),
      ...(query.q
        ? {
            OR: [
              {
                title: {
                  contains: String(query.q),
                  mode: 'insensitive' as const,
                },
              },
              {
                description: {
                  contains: String(query.q),
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [total, jobs] = await this.prisma.$transaction([
      this.prisma.job.count({ where }),
      this.prisma.job.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        include: {
          company: { select: { id: true, name: true, registrationId: true } },
        },
      }),
    ]);

    const response = {
      data: jobs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: skip + jobs.length < total,
      },
    };

    await this.redisService.set(cacheKey, JSON.stringify(response), 60);
    return response;
  }

  async findOne(id: number) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true, registrationId: true } },
        user: {
          select: {
            id: true,
            email: true,
            firstname: true,
            lastname: true,
            role: true,
          },
        },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    return { data: job };
  }

  async update(id: number, updateJobDto: UpdateJobDto) {
    try {
      const updated = await this.prisma.job.update({
        where: { id },
        data: {
          title: updateJobDto.title,
          description: updateJobDto.description,
          location: updateJobDto.location,
          salary: updateJobDto.salary,
          jobType: updateJobDto.jobType,
          isActive: updateJobDto.isActive,
          companyId: updateJobDto.companyId,
        },
      });
      await this.redisService.incr(CacheKeys.jobsListVersionKey());
      return {
        message: 'Job updated successfully',
        id: updated.id,
        data: updated,
      };
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: unknown }).code === 'P2025'
      ) {
        throw new NotFoundException('Job not found');
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const deleted = await this.prisma.job.delete({
        where: { id },
        select: { id: true },
      });
      await this.redisService.incr(CacheKeys.jobsListVersionKey());
      return { message: 'Job deleted successfully', id: deleted.id };
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: unknown }).code === 'P2025'
      ) {
        throw new NotFoundException('Job not found');
      }
      throw error;
    }
  }
}
