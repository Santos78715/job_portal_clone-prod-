import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  registrationId: string;

  @IsInt()
  totalEmployee: number;
}
