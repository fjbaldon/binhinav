import {
    IsNotEmpty,
    IsString,
    IsOptional,
    IsNumber,
    IsUUID,
    ValidateIf,
    MinLength,
} from 'class-validator';

export class CreatePlaceDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @IsNotEmpty()
    locationX: number;

    @IsNumber()
    @IsNotEmpty()
    locationY: number;

    @IsUUID()
    @IsNotEmpty()
    floorPlanId: string;

    @IsUUID()
    @IsOptional()
    @ValidateIf(o => !o.newMerchantUsername)
    merchantId?: string;

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
