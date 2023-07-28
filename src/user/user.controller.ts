import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guard';
import { GetUser } from './decorator';
import { User } from '@prisma/client';
import { UserService } from './user.service';
import { EditUserDto } from './dto';

@UseGuards(JwtGuard)
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}
  @Get()
  getCurrentUser(@GetUser() user: User, @Req() request: Request) {
    return this.userService.getCurrentUser(user, request);
  }

  @Patch()
  editUser(
    @GetUser('id') userId: number,
    @Body('user') dto: EditUserDto,
    @Req() request: Request,
  ) {
    return this.userService.editUser(userId, dto, request);
  }
}
