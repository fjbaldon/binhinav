import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateSelectionLogDto {
    @IsString()
    @IsNotEmpty()
    searchTerm: string;

    @IsUUID()
    @IsNotEmpty()
    placeId: string;

    @IsUUID()
    @IsNotEmpty()
    kioskId: string;
}
