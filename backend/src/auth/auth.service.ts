import { Injectable } from '@nestjs/common';
import { AdminsService } from 'src/admins/admins.service';
import { MerchantsService } from 'src/merchants/merchants.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private adminsService: AdminsService,
        private merchantsService: MerchantsService,
        private jwtService: JwtService,
    ) { }

    async validateUser(username: string, pass: string): Promise<any> {
        let user: any = await this.adminsService.findOneByUsername(username);
        let role = 'admin';

        if (!user) {
            user = await this.merchantsService.findOneByUsername(username);
            role = 'merchant';
        }

        if (user && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user;
            return { ...result, role };
        }
        return null;
    }

    async login(user: any) {
        const payload: any = {
            username: user.username,
            sub: user.id,
            role: user.role,
            name: user.name,
        };

        if (user.role === 'merchant' && user.place) {
            payload.placeId = user.place.id;
        }

        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
