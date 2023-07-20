import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
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
  getCurrentUser(@GetUser() user: User) {
    return this.userService.getCurrentUser(user);
  }

  @Patch()
  editUser(@GetUser('id') userId: number, @Body('user') dto: EditUserDto) {
    return this.userService.editUser(userId, dto);
  }
}
