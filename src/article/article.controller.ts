import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { GetUser } from '../user/decorator';
import { CreateArticleDto, CreateCommentDto, UpdateArticleDto } from './dto';

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

  @Get(':slug')
  getArticle(@Param('slug') slug: string) {
    return this.articleService.getArticle(slug);
  }

  @Get()
  getArticles() {
    return this.articleService.getArticles();
  }

  @UseGuards(JwtGuard)
  @Delete(':slug')
  deleteArticle(@Param('slug') slug: string, @GetUser('id') userId: number) {
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
}
