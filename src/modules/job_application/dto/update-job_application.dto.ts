import { ApplicationStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateJobApplicationDto {
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;
}
