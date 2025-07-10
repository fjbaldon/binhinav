import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        // This calls super and can configure passport-local if needed
        // By default, it looks for 'username' and 'password' in the request body
        super();
    }

    // Passport will automatically call this method with credentials from the request body
    async validate(username: string, password: string): Promise<any> {
        const user = await this.authService.validateUser(username, password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return user; // Passport will attach this to the request object as `req.user`
    }
}
