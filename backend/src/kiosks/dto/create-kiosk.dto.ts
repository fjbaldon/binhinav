import { IsNotEmpty, IsString, IsNumber, IsUUID } from 'class-validator';

export class CreateKioskDto {
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
}
