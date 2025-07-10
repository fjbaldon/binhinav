import { PartialType } from '@nestjs/mapped-types';
import { CreateMerchantDto } from './create-merchant.dto';

// PartialType makes all properties of CreateMerchantDto optional
export class UpdateMerchantDto extends PartialType(CreateMerchantDto) { }
