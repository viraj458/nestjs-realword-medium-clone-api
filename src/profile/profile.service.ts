import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(username: string, userId: number) {
    const profile = await this.prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!profile) {
      throw new NotFoundException('Can not find the user');
    }
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        following: true,
      },
    });
    const isFollowing = user.following.some(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );

    const formattedProfile = {
      username: profile.username,
      bio: profile.bio,
      image: profile.image,
      following: isFollowing,
    };
    return { profile: formattedProfile };
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

    const formattedFollowing = {
      username: followingUser.username,
      bio: followingUser.bio,
      image: followingUser.image,
      following: false,
    };

    return { profile: formattedFollowing };
  }
}
