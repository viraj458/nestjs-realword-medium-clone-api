import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtGuard, OptionalAuthGuard } from '../auth/guard';
import { GetUser } from '../user/decorator';

@Controller('profiles')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  //Get user profile
  @UseGuards(OptionalAuthGuard)
  @Get(':username')
  getProfile(@Param('username') username: string, @GetUser() userId?: number) {
    return this.profileService.getProfile(username, userId);
  }

  //Follow user profile
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  @Post(':username/follow')
  followUser(
    @Param('username') username: string,
    @GetUser('id') userId: number,
  ) {
    return this.profileService.followUser(username, userId);
  }

  //UnFollow user profile
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  @Delete(':username/follow')
  unFollowUser(
    @Param('username') username: string,
    @GetUser('id') userId: number,
  ) {
    return this.profileService.unFollowUser(username, userId);
  }
}
