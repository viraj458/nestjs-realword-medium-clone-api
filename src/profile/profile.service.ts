import { ForbiddenException, Injectable } from '@nestjs/common';
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

  async followUser(username: string, userId: number) {
    const following = await this.prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!following) {
      throw new ForbiddenException('can not find user to follow');
    }

    if (following.id === userId) {
      throw new ForbiddenException('can not follow userself');
    }
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        following: {
          connect: {
            id: following.id,
          },
        },
      },
    });

    const formattedFollowing = {
      username: following.username,
      bio: following.bio,
      image: following.image,
      following: true,
    };

    return { profile: formattedFollowing };
  }
}
