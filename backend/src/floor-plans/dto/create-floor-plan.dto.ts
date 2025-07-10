import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreateFloorPlanDto {
    @IsString()
    @IsNotEmpty()
    name: string;
}
