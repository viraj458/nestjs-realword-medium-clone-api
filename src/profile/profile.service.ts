import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { formatUser } from './utils';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  //Get a user
  async getProfile(username: string, userId?: number) {
    const profile = await this.prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!profile) {
      throw new NotFoundException('Can not find the user');
    }

    let isFollowing = false;

    if (userId !== null) {
      const user = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          following: true,
        },
      });
      if (user) {
        isFollowing = user.following.some(
          (followingUser) =>
            followingUser.username.toLowerCase() === username.toLowerCase(),
        );
      }
    }

    return { profile: formatUser(profile, isFollowing) };
  }

  //Follower a user
  async followUser(username: string, userId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        following: true,
      },
    });
    if (user.username.toLowerCase() === username.toLowerCase()) {
      throw new ForbiddenException('Can not follow userself!');
    }

    const userToFollow = await this.prisma.user.findUnique({
      where: {
        username,
      },
    });
    if (!userToFollow) {
      throw new NotFoundException('No user with that username');
    }

    const followingUser = user.following.some(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
    if (followingUser) {
      throw new ConflictException('already following the user!!');
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

    return { profile: formatUser(userToFollow, true) };
  }

  //UnFollower a user
  async unFollowUser(username: string, userId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        following: true,
      },
    });

    const followingUser = await this.prisma.user.findUnique({
      where: { username },
    });
    if (!followingUser) {
      throw new ForbiddenException('No user with that username');
    }

    const isFollowingUser = user.following.some((user) => {
      return user.username.toLowerCase() === username.toLowerCase();
    });
    if (!isFollowingUser) {
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

    return { profile: formatUser(followingUser, false) };
  }
}
