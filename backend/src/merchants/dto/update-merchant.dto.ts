import { IsString, MinLength, IsOptional } from 'class-validator';

// This DTO is now more specific and doesn't use PartialType.
// It explicitly omits `placeId`, as place assignment is managed via the Places module,
// which aligns with the frontend UI/UX decision.
export class UpdateMerchantDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @MinLength(4)
    @IsOptional()
    username?: string;

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @IsOptional()
    password?: string;
}