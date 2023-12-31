import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagService {
  constructor(private prisma: PrismaService) {}

  //Get all tags
  async getAllTag() {
    const tags = await this.prisma.tag.findMany({
      select: {
        name: true,
      },
    });
    return { tags: tags };
  }
}
