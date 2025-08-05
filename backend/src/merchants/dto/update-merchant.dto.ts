import { IsString, MinLength, IsOptional, IsEmail } from 'class-validator';

export class UpdateMerchantDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @MinLength(4)
    @IsOptional()
    username?: string;

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @IsOptional()
    password?: string;
}
