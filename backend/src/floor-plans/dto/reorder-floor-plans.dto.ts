import { IsArray, IsNotEmpty, IsUUID, ArrayMinSize } from 'class-validator';

export class ReorderFloorPlansDto {
    @IsArray()
    @IsNotEmpty()
    @ArrayMinSize(1)
    @IsUUID('4', { each: true })
    ids: string[];
}
