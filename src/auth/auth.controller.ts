import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SigninDto, SignupDto } from './dto';

@Controller('users')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post()
  signup(@Body('user') dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signin(@Body('user') dto: SigninDto) {
    return this.authService.signin(dto);
  }
}
