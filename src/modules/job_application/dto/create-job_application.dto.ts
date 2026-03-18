import { IsInt, IsNotEmpty, IsString, IsUrl, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateJobApplicationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  jobId: number;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  resumeUrl: string;
}
