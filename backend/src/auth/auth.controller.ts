import { Controller, Post, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Request() req) {
        // `req.user` is populated by the LocalStrategy's validate() method
        return this.authService.login(req.user);
    }

    // This is a sample protected route to test the JWT
    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req) {
        // `req.user` is now populated by the JwtStrategy's validate() method
        // It contains the payload we returned: { userId, username, role }
        return req.user;
    }
}
