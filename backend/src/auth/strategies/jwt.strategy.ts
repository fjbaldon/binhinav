import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        // Get the secret from config service
        const secret = configService.get<string>('JWT_SECRET');

        // Throw an error on application start if the secret is not defined
        if (!secret) {
            throw new Error('JWT secret key is not defined in environment variables.');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret, // Now 'secret' is guaranteed to be a string
        });
    }

    // Passport first verifies the token's signature and expiration,
    // then it calls this validate() method with the decoded payload.
    async validate(payload: any) {
        // The payload is what we put into it in the auth.service login method.
        // We return it so it can be attached to the request object.
        // The existence of a valid payload means the user is authenticated.
        if (!payload) {
            throw new UnauthorizedException();
        }
        return {
            userId: payload.sub,
            username: payload.username,
            role: payload.role,
        };
    }
}