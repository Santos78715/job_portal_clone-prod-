import { JobType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ListJobsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @IsIn(['createdAt', 'updatedAt', 'salary', 'title'])
  @IsOptional()
  sortBy?: 'createdAt' | 'updatedAt' | 'salary' | 'title' = 'createdAt';

  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsString()
  @IsOptional()
  q?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  minSalary?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  maxSalary?: number;

  @IsEnum(JobType)
  @IsOptional()
  jobType?: JobType;
}
