import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EditUserDto } from './dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  getCurrentUser(user: User, request: Request) {
    const token = request.headers['authorization'].split(' ')[1];

    const formattedUser = {
      email: user.email,
      username: user.username,
      bio: user.bio,
      image: user.image,
      token,
    };
    return { user: formattedUser };
  }

  async editUser(userId: number, dto: EditUserDto, request: Request) {
    const token = request.headers['authorization'].split(' ')[1];
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
      token,
    };

    return { user: formattedUser };
  }
}
