import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { isUUID } from 'class-validator';

@Injectable()
export class ParseUuidArrayPipe implements PipeTransform<string, string[]> {
    transform(value: string): string[] {
        if (!value) {
            return [];
        }

        const ids = value.split(',').map(id => id.trim());

        for (const id of ids) {
            if (!isUUID(id, '4')) {
                throw new BadRequestException(`Invalid UUID format in array: "${id}".`);
            }
        }

        return ids;
    }
}
