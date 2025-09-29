import { 
  IsEmail, 
  IsOptional, 
  IsString, 
  IsStrongPassword 
} from "class-validator";

export class UpdateUserAdminDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  fathersLastName: string;

  @IsOptional()
  @IsString()
  mothersLastName: string;

  @IsOptional()
  @IsString()
  username: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsStrongPassword()
  hashedPassword: string;

  @IsOptional()
  @IsString()
  userRole: string;

  @IsOptional()
  @IsString()
  userStatus: string;
}