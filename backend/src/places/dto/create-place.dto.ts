import {
    IsNotEmpty,
    IsString,
    IsOptional,
    IsNumber,
    IsUUID,
} from 'class-validator';

// DTO is now much leaner, reflecting that an admin only sets up the shell of a place.
// Description, category, etc., are managed by the merchant after creation.
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
    merchantId?: string;
}
