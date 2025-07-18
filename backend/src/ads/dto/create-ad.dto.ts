import {
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateAdDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    isActive?: boolean = true;

    @IsOptional()
    @IsInt()
    @Type(() => Number) // Revert to the simpler Type decorator
    displayOrder?: number;
}
