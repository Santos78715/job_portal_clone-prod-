import { JobType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  salary?: number;

  @IsEnum(JobType)
  jobType: JobType;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  companyId: number;
}
