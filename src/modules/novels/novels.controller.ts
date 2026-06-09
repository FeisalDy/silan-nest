import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  BadRequestException,
  Put,
  Body,
  Delete,
} from '@nestjs/common';
import { NovelsService } from './novels.service';
import { PageOptionsDto } from '@/common/dto/page-options.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { UpdateNovelDto } from '@/modules/novels/dto/update-novel.dto';

@ApiTags('Novels')
@ApiBearerAuth('access-token')
@Controller('novels')
// @formatter:off
export class NovelsController {
  constructor(private readonly novelsService: NovelsService) {}

  @Public()
  @Get()
  async getAllWithPagination(@Query() pageOptionsDto: PageOptionsDto) {
    return this.novelsService.paginateNovels(pageOptionsDto);
  }

  @Public()
  @Get('search')
  searchNovelsByChapterKeyword(@Query('q') query: string) {
    if (!query) {
      throw new BadRequestException('Query parameter q is required');
    }
    return this.novelsService.searchNovelsByChapterKeyword(query);
  }

  @Put(':id')
  async setNovelById(
    @Param('id') id: string,
    @Body() updateNovelDto: UpdateNovelDto
  ) {
    return this.novelsService.setNovelById({ id, updateNovelDto });
  }

  @Delete(':id')
  async deleteNovelById(@Param('id') id: string) {
    return this.novelsService.deleteNovelById(id);
  }

  @Public()
  @Get(':id/chapters')
  getAllChaptersByNovelIdWithPagination(
    @Param('id') id: string,
    @Query() pageOptionsDto: PageOptionsDto
  ) {
    return this.novelsService.paginateNovelChapters(id, pageOptionsDto);
  }

  @Public()
  @Get(':id/chapters/:volumeNumber/:chapterNumber')
  async getChapter(
    @Param('id') id: string,
    @Param('volumeNumber', ParseIntPipe) volumeNumber: number,
    @Param('chapterNumber', ParseIntPipe) chapterNumber: number
  ) {
    return this.novelsService.getChapter(id, volumeNumber, chapterNumber, 0);
  }

  @Public()
  @Get(':novelId/chapters/:volumeNumber/:chapterNumber/:chapterSubNumber')
  async getSubChapter(
    @Param('novelId') novelId: string,
    @Param('volumeNumber', ParseIntPipe) volumeNumber: number,
    @Param('chapterNumber', ParseIntPipe) chapterNumber: number,
    @Param('chapterSubNumber', ParseIntPipe) chapterSubNumber: number
  ) {
    return this.novelsService.getChapter(
      novelId,
      volumeNumber,
      chapterNumber,
      chapterSubNumber
    );
  }

  @Public()
  @Get(':identifier')
  async getNovelByIdentifier(@Param('identifier') identifier: string) {
    const novel = await this.novelsService.getNovelBySlugOrId(identifier);

    if (!novel) {
      throw new NotFoundException('Novel not found');
    }

    return novel;
  }
}
