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
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        following: true,
      },
    });

    const followingUser = user.following.find(
      (user) => user.username === username,
    );
    if (followingUser) {
      throw new ForbiddenException('already following the user!!');
    }

    const userToFollow = await this.prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!userToFollow) {
      throw new ForbiddenException('User not found');
    }

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        following: {
          connect: {
            id: userToFollow.id,
          },
        },
      },
    });

    const formattedFollowing = {
      username: userToFollow.username,
      bio: userToFollow.bio,
      image: userToFollow.image,
      following: true,
    };

    return { profile: formattedFollowing };
  }

  async unFollowUser(username: string, userId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        following: true,
      },
    });

    const followingUser = user.following.find(
      (user) => user.username === username,
    );
    if (!followingUser) {
      throw new ForbiddenException('User not in the following list');
    }

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        following: {
          disconnect: {
            id: followingUser.id,
          },
        },
      },
    });

    const formattedFollowing = {
      username: followingUser.username,
      bio: followingUser.bio,
      image: followingUser.image,
      following: false,
    };

    return { profile: formattedFollowing };
  }
}
