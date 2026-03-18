import { Role } from '@prisma/client';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  firstname: string;

  @IsString()
  @IsNotEmpty()
  lastname: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsString()
  @IsOptional()
  profileImage?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsInt()
  @IsOptional()
  companyId?: number;
}
