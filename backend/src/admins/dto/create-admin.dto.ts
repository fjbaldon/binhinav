import { IsNotEmpty, IsString, MinLength, IsEmail, IsBoolean, IsOptional } from 'class-validator';

export class CreateAdminDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(4)
    username: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    password: string;

    @IsBoolean()
    @IsOptional()
    isSuperAdmin?: boolean;
}
