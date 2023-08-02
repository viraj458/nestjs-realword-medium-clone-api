import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EditUserDto } from './dto';
import { formatUser } from './utils';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  //Get current user by token
  getCurrentUser(user: User, request: Request) {
    const token = request.headers['authorization'].split(' ')[1];

    return { user: formatUser(user, token) };
  }

  //Edit user
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

    return { user: formatUser(user, token) };
  }
}
