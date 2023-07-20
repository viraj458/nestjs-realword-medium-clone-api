import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EditUserDto } from './dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  getCurrentUser(user: User) {
    const formattedUser = {
      email: user.email,
      username: user.username,
      bio: user.bio,
      image: user.image,
    };
    return { user: formattedUser };
  }

  async editUser(userId: number, dto: EditUserDto) {
    const user = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...dto,
      },
    });

    const formattedUser = {
      email: user.email,
      username: user.username,
      bio: user.bio,
      image: user.image,
    };

    return { user: formattedUser };
  }
}
