import {
    IsNotEmpty, IsString, IsOptional, IsEnum, IsNumber, IsUUID,
} from 'class-validator';

export class CreatePlaceDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsUUID()
    @IsOptional()
    categoryId?: string;

    @IsString()
    @IsNotEmpty()
    businessHours: string;

    @IsNumber()
    locationX: number;

    @IsNumber()
    locationY: number;

    @IsUUID()
    @IsNotEmpty()
    floorPlanId: string; // A place MUST belong to a floor plan

    @IsUUID()
    @IsOptional()
    merchantId?: string; // A place might not have a merchant assigned initially
}
