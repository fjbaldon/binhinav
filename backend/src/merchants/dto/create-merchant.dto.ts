import { IsNotEmpty, IsString, MinLength, IsUUID } from 'class-validator';

export class CreateMerchantDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(4)
    username: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    password: string;

    @IsUUID()
    @IsNotEmpty({ message: 'A place must be assigned to a new merchant.' })
    placeId: string;
}
