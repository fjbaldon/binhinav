import { IsString, MinLength, IsOptional } from 'class-validator';

export class UpdateAdminDto {
    @IsString()
    @IsOptional()
    username?: string;

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @IsOptional()
    password?: string;
}
