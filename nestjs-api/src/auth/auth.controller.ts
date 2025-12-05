import { Controller, Post, Body, UseGuards, Req, Get } from "@nestjs/common"
import type { AuthService } from "./auth.service"
import { LocalAuthGuard } from "./local-auth.guard"
import { JwtAuthGuard } from "./jwt-auth.guard"

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req) {
    return this.authService.login(req.user);
  }

  @Post('register')
  async register(@Body() body: { email: string; password: string; name: string }) {
    return this.authService.register(body.email, body.password, body.name);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req) {
    return req.user;
  }
}
