import { IsNotEmpty, IsString, IsOptional, IsNumber, IsUUID, ValidateIf, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdatePlaceDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsUUID()
    @IsOptional()
    @Transform(({ value }) => (value === '' || value === 'none' ? null : value))
    categoryId?: string | null;

    @IsString()
    @IsOptional()
    businessHours?: string;

    @IsNumber()
    @IsOptional()
    locationX?: number;

    @IsNumber()
    @IsOptional()
    locationY?: number;

    @IsUUID()
    @IsOptional()
    floorPlanId?: string;

    @IsUUID()
    @IsOptional()
    merchantId?: string | null;

    @IsString()
    @IsOptional()
    @ValidateIf(o => !!o.newMerchantUsername)
    @IsNotEmpty({ message: 'New merchant name cannot be empty.' })
    newMerchantName?: string;

    @IsString()
    @MinLength(4)
    @IsOptional()
    newMerchantUsername?: string;

    @IsString()
    @MinLength(8, { message: 'New merchant password must be at least 8 characters long' })
    @IsOptional()
    @ValidateIf(o => !!o.newMerchantUsername)
    @IsNotEmpty({ message: 'New merchant password cannot be empty.' })
    newMerchantPassword?: string;
}
