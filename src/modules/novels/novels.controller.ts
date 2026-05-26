import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { NovelsService } from './novels.service';
import { PageOptionsDto } from '@/common/dto/page-options.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('novels')
@Controller('novels')
export class NovelsController {
  constructor(private readonly novelsService: NovelsService) {}

  @Get() async findAll(@Query() pageOptionsDto: PageOptionsDto) {
    return this.novelsService.paginateNovels(pageOptionsDto);
  }

  @Get('search') searchNovelsByChapterKeyword(@Query('q') query: string) {
    if (!query) {
      throw new BadRequestException('Query parameter q is required');
    }
    return this.novelsService.searchNovelsByChapterKeyword(query);
  }

  @Get(':identifier') async findOne(@Param('identifier') identifier: string) {
    const novel = await this.novelsService.findNovelBySlugOrId(identifier);

    if (!novel) {
      throw new NotFoundException('Novel not found');
    }

    return novel;
  }

  @Get(':novelId/chapters') findChaptersByNovelId(
    @Param('novelId') novelId: string,
    @Query() pageOptionsDto: PageOptionsDto
  ) {
    return this.novelsService.paginateNovelChapters(novelId, pageOptionsDto);
  }

  @Get(':novelId/chapters/:volumeNumber/:chapterNumber') async getMainChapter(
    @Param('novelId') novelId: string,
    @Param('volumeNumber', ParseIntPipe) volumeNumber: number,
    @Param('chapterNumber', ParseIntPipe) chapterNumber: number
  ) {
    return this.getChapter(novelId, volumeNumber, chapterNumber, 0);
  }

  @Get(':novelId/chapters/:volumeNumber/:chapterNumber/:chapterSubNumber')
  async getSubChapter(
    @Param('novelId') novelId: string,
    @Param('volumeNumber', ParseIntPipe) volumeNumber: number,
    @Param('chapterNumber', ParseIntPipe) chapterNumber: number,
    @Param('chapterSubNumber', ParseIntPipe) chapterSubNumber: number
  ) {
    return this.getChapter(
      novelId,
      volumeNumber,
      chapterNumber,
      chapterSubNumber
    );
  }

  private async getChapter(
    novelId: string,
    volumeNumber: number,
    chapterNumber: number,
    chapterSubNumber: number
  ) {
    const chapter = await this.novelsService.findChapter(
      novelId,
      volumeNumber,
      chapterNumber,
      chapterSubNumber
    );

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    return chapter;
  }
}
