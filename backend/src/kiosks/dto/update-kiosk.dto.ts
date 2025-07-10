import { PartialType } from '@nestjs/mapped-types';
import { CreateKioskDto } from './create-kiosk.dto';

export class UpdateKioskDto extends PartialType(CreateKioskDto) { }
