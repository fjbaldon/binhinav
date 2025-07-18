import { IsNotEmpty, IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

// This DTO now includes ALL possible update fields from both Admins and Merchants.
// The service layer will be responsible for picking which fields to use based on the user's role.
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
    // This transform allows the frontend to send an empty string or null to un-set the category.
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
    // This allows the admin to explicitly pass `null` to unassign a merchant.
    merchantId?: string | null;
}
