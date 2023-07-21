import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(username: string) {
    const profile = await this.prisma.user.findFirst({
      where: {
        username,
      },
    });

    return { profile };
  }
}
