import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto, CreateCommentDto, UpdateArticleDto } from './dto';
import slugify from 'slugify';

@Injectable()
export class ArticleService {
  constructor(private prisma: PrismaService) {}

  async createArticle(userId: number, dto: CreateArticleDto) {
    const slug = slugify(dto.title, { lower: true });

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
        favoritesCount: article.favoritedBy.length,
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

  async favoriteArticle(slug: string, userId: number) {
    const article = await this.prisma.article.findUnique({
      where: {
        slug,
      },
      include: {
        favoritedBy: true,
      },
    });

    if (!article) throw new ForbiddenException('Can not find article!');

    const checkFavorite = article.favoritedBy.find(
      (user) => user.id === userId,
    );
    if (checkFavorite) {
      throw new ForbiddenException('Article already in favorites!!');
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

    const favoriteCount = favoritearticle.favoritedBy.length;

    const formattedAuthor = {
      username: favoritearticle.author.username,
      bio: favoritearticle.author.bio,
      image: favoritearticle.author.image,
    };

    const formattedData = {
      slug: favoritearticle.slug,
      title: favoritearticle.title,
      description: favoritearticle.description,
      body: favoritearticle.body,
      tagList: favoritearticle.tags,
      createdAt: favoritearticle.createdAt,
      updatedAt: favoritearticle.updatedAt,
      author: formattedAuthor,
      favorited: true,
      favoritesCount: favoriteCount,
    };

    return { article: formattedData };
  }

  async unFavoriteArticle(slug: string, userId: number) {
    const article = await this.prisma.article.findUnique({
      where: {
        slug,
      },
      include: {
        favoritedBy: true,
      },
    });

    if (!article) throw new ForbiddenException('Can not find article!');

    const checkFavorite = article.favoritedBy.find(
      (user) => user.id === userId,
    );
    if (!checkFavorite) {
      throw new ForbiddenException(
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

    const favoriteCount = unFavoritearticle.favoritedBy.length;

    const formattedAuthor = {
      username: unFavoritearticle.author.username,
      bio: unFavoritearticle.author.bio,
      image: unFavoritearticle.author.image,
    };

    const formattedData = {
      slug: unFavoritearticle.slug,
      title: unFavoritearticle.title,
      description: unFavoritearticle.description,
      body: unFavoritearticle.body,
      tagList: unFavoritearticle.tags,
      createdAt: unFavoritearticle.createdAt,
      updatedAt: unFavoritearticle.updatedAt,
      author: formattedAuthor,
      favorited: false,
      favoritesCount: favoriteCount,
    };

    return { article: formattedData };
  }

  async feedArticles(userId: number) {
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
        favoritesCount: article.favoritedBy.length,
      };

      return formattedData;
    });

    const articlesCount = articles.length;

    return { articles: formattedArticles, articlesCount };
  }
}
