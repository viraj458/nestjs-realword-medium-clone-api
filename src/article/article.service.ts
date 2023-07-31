import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto, CreateCommentDto, UpdateArticleDto } from './dto';
import slugify from 'slugify';
import { formatArticle, formatComment } from './utils/index';

@Injectable()
export class ArticleService {
  constructor(private prisma: PrismaService) {}

  //Create a article
  async createArticle(userId: number, dto: CreateArticleDto) {
    let slug = slugify(dto.title, {
      lower: true,
      remove: /[^a-zA-Z0-9\s]/g,
      replacement: '-',
    });
    const slugExists = await this.prisma.article.findFirst({
      where: { slug },
    });
    if (slugExists) {
      slug = `${slug}-${Math.floor(Math.random() * 1000000)}`;
    }

    const tags = await Promise.all(
      dto.tagList.map((name) =>
        this.prisma.tag.upsert({
          where: { name },
          create: { name },
          update: { name },
        }),
      ),
    );

    const article = await this.prisma.article.create({
      data: {
        slug,
        author: {
          connect: { id: userId },
        },
        tags: {
          connect: tags.map((tag) => ({ id: tag.id })),
        },
        title: dto.title,
        description: dto.description,
        body: dto.body,
      },
      include: {
        author: true,
        tags: true,
        favoritedBy: true,
      },
    });

    return { article: formatArticle(article) };
  }

  //Get a single article
  async getArticle(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: {
        slug,
      },
      include: {
        author: true,
        tags: true,
        favoritedBy: true,
      },
    });

    if (!article) {
      throw new NotFoundException('Article can not be found!');
    }

    return { article: formatArticle(article) };
  }

  //Get multiple articles based on tag, author, favorited
  async getArticles(query: any) {
    const { tag, author, favorited, limit = 20, offset = 0 } = query;
    const where = {};

    // Filter by tag
    if (tag) {
      where['tags'] = {
        some: {
          name: tag,
        },
      };
    }

    // Filter by author
    if (author) {
      where['author'] = {
        username: author,
      };
    }

    // Filter by favorited
    if (favorited) {
      where['favoritedBy'] = {
        some: {
          username: favorited,
        },
      };
    }

    const articles = await this.prisma.article.findMany({
      where,
      include: {
        author: true,
        tags: true,
        favoritedBy: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const formattedArticles = articles.map((article) => formatArticle(article));

    const articlesCount = articles.length;

    return { articles: formattedArticles, articlesCount };
  }

  //Delete single article
  async deleteArticle(slug: string, userId: number) {
    const article = await this.prisma.article.findUnique({
      where: {
        slug,
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }
    if (article.authorId !== userId) {
      throw new ForbiddenException('Can not allow!!!');
    }

    await this.prisma.article.delete({
      where: {
        slug,
      },
    });

    return 'Article deleted!!';
  }

  //Update single article
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

    if (article.authorId !== userId) {
      throw new ForbiddenException('Access denied!!');
    }
    if (!article) {
      throw new NotFoundException('Article not found');
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
        favoritedBy: true,
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

    return { article: formatArticle(updated) };
  }

  //Add a comment to a article
  async addComment(dto: CreateCommentDto, slug: string, userId: number) {
    const article = await this.prisma.article.findUnique({
      where: {
        slug,
      },
    });
    if (!article) {
      throw new NotFoundException('Cannot find the article');
    }

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

    return { comment: formatComment(comment) };
  }

  //Get multiple comments by article slug
  async getComments(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: {
        slug,
      },
    });
    if (!article) throw new NotFoundException('Cannot find the article!!');

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

    const formattedComments = comments.map((comment) => formatComment(comment));
    return { comments: formattedComments };
  }

  //Delete single comment
  async deleteComment(commentId: number, userId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: {
        id: commentId,
      },
    });

    if (!comment) throw new NotFoundException('Cannot find the comment!!');

    if (comment.authorId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to delete this comment.',
      );
    }
    await this.prisma.comment.delete({
      where: {
        id: commentId,
      },
    });

    return 'Comment deleted!!';
  }

  //Set a article as a favorite
  async favoriteArticle(slug: string, userId: number) {
    const article = await this.prisma.article.findUnique({
      where: {
        slug,
      },
      include: {
        favoritedBy: true,
      },
    });

    if (!article) throw new NotFoundException('Can not find article!');

    const checkFavorite = article.favoritedBy.find(
      (user) => user.id === userId,
    );
    if (checkFavorite) {
      throw new ConflictException('Article is already in favorites');
    }
    const favoritearticle = await this.prisma.article.update({
      where: {
        slug,
      },
      data: {
        favoritedBy: {
          connect: {
            id: userId,
          },
        },
      },
      include: {
        tags: true,
        author: true,
        favoritedBy: true,
      },
    });

    return { article: formatArticle(favoritearticle) };
  }

  //Set a existing favorite article as a unfavorite
  async unFavoriteArticle(slug: string, userId: number) {
    const article = await this.prisma.article.findUnique({
      where: {
        slug,
      },
      include: {
        favoritedBy: true,
      },
    });

    if (!article) throw new NotFoundException('Can not find article!');

    const checkFavorite = article.favoritedBy.find(
      (user) => user.id === userId,
    );
    if (!checkFavorite) {
      throw new NotFoundException(
        'Can not find the article in your favorites!!',
      );
    }

    const unFavoritearticle = await this.prisma.article.update({
      where: {
        slug,
      },
      data: {
        favoritedBy: {
          disconnect: {
            id: userId,
          },
        },
      },
      include: {
        tags: true,
        author: true,
        favoritedBy: true,
      },
    });

    return { article: formatArticle(unFavoritearticle) };
  }

  //Get multiple articles created by followed users, ordered by most recent first
  async feedArticles(userId: number, query: any) {
    const { limit = 20, offset = 0 } = query;
    const articles = await this.prisma.article.findMany({
      where: {
        author: {
          followedBy: {
            some: {
              id: userId,
            },
          },
        },
      },
      include: {
        tags: true,
        author: true,
        favoritedBy: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const formattedArticles = articles.map((article) => formatArticle(article));

    const articlesCount = articles.length;
    return { articles: formattedArticles, articlesCount };
  }
}
