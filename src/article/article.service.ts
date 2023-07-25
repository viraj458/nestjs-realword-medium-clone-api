import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto, CreateCommentDto, UpdateArticleDto } from './dto';
import slugify from 'slugify';

@Injectable()
export class ArticleService {
  constructor(private prisma: PrismaService) {}

  async createArticle(userId: number, dto: CreateArticleDto) {
    const slug = slugify(dto.title, { lower: true });
    const article = await this.prisma.article.create({
      data: {
        slug,
        author: {
          connect: { id: userId },
        },
        tags: {
          create: dto.tagList.map((name) => ({
            name,
          })),
        },
        title: dto.title,
        description: dto.description,
        body: dto.body,
      },
      include: {
        author: true,
        tags: true,
      },
    });

    const formattedAuthor = {
      username: article.author.username,
      bio: article.author.bio,
      image: article.author.image,
    };

    const formattedData = {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tags,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      author: formattedAuthor,
    };

    return { article: formattedData };
  }

  async getArticle(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: {
        slug,
      },
      include: {
        author: true,
        tags: true,
      },
    });

    const formattedAuthor = {
      username: article.author.username,
      bio: article.author.bio,
      image: article.author.image,
    };

    const formattedData = {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tags,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      author: formattedAuthor,
    };

    return { article: formattedData };
  }

  async getArticles() {
    const articles = await this.prisma.article.findMany({
      include: {
        author: true,
        tags: true,
      },
    });

    const formattedArticles = articles.map((article) => {
      const formattedAuthor = {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
      };

      const formattedData = {
        slug: article.slug,
        title: article.title,
        description: article.description,
        body: article.body,
        tagList: article.tags.map((tag) => tag.name),
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        author: formattedAuthor,
      };

      return formattedData;
    });

    const articlesCount = articles.length;

    return { articles: formattedArticles, articlesCount };
  }

  async deleteArticle(slug: string, userId: number) {
    const article = await this.prisma.article.findUnique({
      where: {
        slug,
      },
    });

    if (!article || article.authorId !== userId) {
      throw new ForbiddenException('Access denied!!!');
    }

    await this.prisma.article.delete({
      where: {
        slug,
      },
    });

    return 'Article deleted!!';
  }

  async updateArticle(slug: string, userId: number, dto: UpdateArticleDto) {
    const article = await this.prisma.article.findUnique({
      where: {
        slug,
      },
      include: {
        tags: true,
        author: true,
      },
    });

    if (!article || article.authorId !== userId) {
      throw new ForbiddenException('Access denied!!!');
    }

    const existingTagNames = article.tags.map((tag) => tag.name);

    const newTags = dto.tagList?.filter(
      (tag) => !existingTagNames.includes(tag),
    );

    const tagsToRemove = article.tags.filter(
      (tag) => !dto.tagList?.includes(tag.name),
    );

    const updated = await this.prisma.article.update({
      where: {
        slug,
      },
      data: {
        title: dto.title,
        description: dto.description,
        body: dto.body,
        tags: {
          create: newTags?.map((name) => ({
            name,
          })),
        },
      },
      include: {
        author: true,
        tags: true,
      },
    });

    if (tagsToRemove.length > 0) {
      await this.prisma.tag.deleteMany({
        where: {
          id: {
            in: tagsToRemove.map((tag) => tag.id),
          },
        },
      });
    }

    const formattedAuthor = {
      username: updated.author.username,
      bio: updated.author.bio,
      image: updated.author.image,
    };

    const formattedData = {
      slug: updated.slug,
      title: updated.title,
      description: updated.description,
      tagList: updated.tags.map((tag) => tag.name),
      body: updated.body,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      author: formattedAuthor,
    };

    return { article: formattedData };
  }

  async addComment(dto: CreateCommentDto, slug: string, userId: number) {
    const article = await this.prisma.article.findUnique({
      where: {
        slug,
      },
    });
    if (!article) throw new ForbiddenException('Cannot find the article!!');

    const comment = await this.prisma.comment.create({
      data: {
        body: dto.body,
        article: {
          connect: { slug },
        },
        author: {
          connect: { id: userId },
        },
      },
      include: {
        author: true,
      },
    });

    const formattedAuthor = {
      username: comment.author.username,
      bio: comment.author.bio,
      image: comment.author.image,
    };

    const formattedData = {
      id: comment.id,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      body: comment.body,
      author: formattedAuthor,
    };
    return { comment: formattedData };
  }

  async getComments(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: {
        slug,
      },
    });
    if (!article) throw new ForbiddenException('Cannot find the article!!');

    const comments = await this.prisma.comment.findMany({
      where: {
        article: { slug },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: true,
      },
    });

    const formattedComments = comments.map((comment) => {
      const formattedAuthor = {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image,
      };

      const formattedData = {
        id: comment.id,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        body: comment.body,
        author: formattedAuthor,
      };

      return formattedData;
    });
    return { comments: formattedComments };
  }

  async deleteComment(commentId: number, userId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: {
        id: commentId,
      },
    });

    if (!comment) throw new ForbiddenException('Cannot find the comment!!');

    if (comment.authorId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to delete this comment.',
      );
    }
    await this.prisma.comment.delete({
      where: {
        id: commentId,
      },
    });

    return 'Comment deleted!!';
  }
}
