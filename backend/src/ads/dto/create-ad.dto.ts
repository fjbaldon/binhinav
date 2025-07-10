import {
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAdDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    // The 'isActive' field from form-data will be a string 'true' or 'false'.
    // We need to transform it into a boolean.
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    isActive?: boolean = true;

    @IsOptional()
    @IsInt()
    @Type(() => Number) // Also transform from string if needed
    displayOrder?: number;
}
