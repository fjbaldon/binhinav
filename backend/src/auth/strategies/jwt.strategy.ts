import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        const secret = configService.get<string>('JWT_SECRET');

        if (!secret) {
            throw new Error('JWT secret key is not defined in environment variables.');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
        });
    }

    async validate(payload: any) {
        if (!payload) {
            throw new UnauthorizedException();
        }
        return {
            userId: payload.sub,
            username: payload.username,
            role: payload.role,
            name: payload.name,
            isSuperAdmin: payload.isSuperAdmin,
            placeId: payload.placeId,
        };
    }
}
