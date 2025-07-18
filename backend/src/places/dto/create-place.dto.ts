import {
    IsNotEmpty, IsString, IsOptional, IsNumber, IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePlaceDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsUUID()
    @IsOptional()
    @Transform(({ value }) => (value === '' || value === 'null' ? null : value))
    categoryId?: string;

    @IsString()
    @IsOptional()
    businessHours?: string;

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
