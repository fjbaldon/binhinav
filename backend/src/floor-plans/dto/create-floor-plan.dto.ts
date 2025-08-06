import { IsNotEmpty, IsString, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFloorPlanDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    displayOrder?: number;
}
