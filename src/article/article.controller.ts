import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { GetUser } from '../user/decorator';
import { CreateArticleDto, CreateCommentDto, UpdateArticleDto } from './dto';
import { JwtGuard, OptionalAuthGuard } from '../auth/guard';

@Controller('articles')
export class ArticleController {
  constructor(private articleService: ArticleService) {}

  @UseGuards(JwtGuard)
  @Post()
  createArticle(
    @GetUser('id') userId: number,
    @Body('article') dto: CreateArticleDto,
  ) {
    return this.articleService.createArticle(userId, dto);
  }

  @UseGuards(JwtGuard)
  @Get('feed')
  feedArticles(@GetUser('id') userId: number, @Query() query: any) {
    return this.articleService.feedArticles(userId, query);
  }

  @Get(':slug')
  getArticle(@Param('slug') slug: string) {
    return this.articleService.getArticle(slug);
  }

  @UseGuards(OptionalAuthGuard)
  @Get()
  getArticles(@Query() query: any, @GetUser() userId: number) {
    return this.articleService.getArticles(query, userId);
  }

  @UseGuards(JwtGuard)
  @Delete(':slug')
  deleteArticle(@Param('slug') slug: string, @GetUser() userId: number) {
    return this.articleService.deleteArticle(slug, userId);
  }

  @UseGuards(JwtGuard)
  @Patch(':slug')
  updateArticle(
    @Param('slug') slug: string,
    @GetUser('id') userId: number,
    @Body('article') dto: UpdateArticleDto,
  ) {
    return this.articleService.updateArticle(slug, userId, dto);
  }

  @UseGuards(JwtGuard)
  @Post(':slug/comments')
  addComment(
    @Body('comment') dto: CreateCommentDto,
    @Param('slug') slug: string,
    @GetUser('id') userId: number,
  ) {
    return this.articleService.addComment(dto, slug, userId);
  }

  @UseGuards(OptionalAuthGuard)
  @Get(':slug/comments')
  getComments(@Param('slug') slug: string, @GetUser() userId: number) {
    return this.articleService.getComments(slug, userId);
  }

  @UseGuards(JwtGuard)
  @Delete(':slug/comments/:id')
  deleteComment(
    @Param('id', ParseIntPipe) commentId: number,
    @GetUser('id') userId: number,
  ) {
    return this.articleService.deleteComment(commentId, userId);
  }

  @UseGuards(JwtGuard)
  @Post(':slug/favorite')
  favoriteArticle(@Param('slug') slug: string, @GetUser('id') userId: number) {
    return this.articleService.favoriteArticle(slug, userId);
  }

  @UseGuards(JwtGuard)
  @Delete(':slug/favorite')
  unFavoriteArticle(
    @Param('slug') slug: string,
    @GetUser('id') userId: number,
  ) {
    return this.articleService.unFavoriteArticle(slug, userId);
  }
}
