import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { OptionalAuthGuard } from '../auth/guard';

@Controller('profiles')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @UseGuards(OptionalAuthGuard)
  @Get(':username')
  getProfile(@Param('username') username: string) {
    return this.profileService.getProfile(username);
  }
}
