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

    /**
     * Validates a user by username and password.
     * Crucially, it checks both Admins and Merchants tables.
     */
    async validateUser(username: string, pass: string): Promise<any> {
        // First, try to find an admin
        let user: any = await this.adminsService.findOneByUsername(username);
        let role = 'admin';

        // If not an admin, try to find a merchant
        if (!user) {
            user = await this.merchantsService.findOneByUsername(username);
            role = 'merchant';
        }

        if (user && (await bcrypt.compare(pass, user.password))) {
            // We don't want to return the password hash
            const { password, ...result } = user;
            // We add the role to the result object
            return { ...result, role };
        }
        return null;
    }

    /**
     * Generates a JWT for a validated user.
     */
    async login(user: any) {
        const payload = {
            username: user.username,
            sub: user.id, // 'sub' is standard for subject (user ID)
            role: user.role, // We include the role in the token!
        };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
