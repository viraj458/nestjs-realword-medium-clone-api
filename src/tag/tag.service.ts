import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagService {
  constructor(private prisma: PrismaService) {}

  async getAllTag() {
    const tags = await this.prisma.tag.findMany({
      select: {
        name: true,
      },
      distinct: ['name'],
    });
    return { tags: tags };
  }
}
