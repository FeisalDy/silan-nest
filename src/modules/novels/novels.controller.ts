import {
  Controller,
  Get,
  Post,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { NovelsService } from './novels.service';
import { PageOptionsDto } from '../../common/dto/page-options.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';

@ApiTags('novels')
@Controller('novels')
export class NovelsController {
  constructor(private readonly novelsService: NovelsService) {}

  @Get()
  async findAll(@Query() pageOptionsDto: PageOptionsDto) {
    return this.novelsService.paginateNovels(pageOptionsDto);
  }

  @Post('import/preview')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'source'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Novel .txt file to preview',
        },
        source: {
          type: 'string',
          description: 'Source identifier (e.g. source-a, source-b)',
        },
      },
    },
  })
  previewNovel(
    @UploadedFile() file: Express.Multer.File,
    @Body('source') source: string,
  ) {
    return this.novelsService.previewNovelFromTxt(file, source);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'source'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Novel .txt file to import',
        },
        source: {
          type: 'string',
          description: 'Source identifier (e.g. source-a, source-b)',
        },
      },
    },
  })
  async importNovel(
    @UploadedFile() file: Express.Multer.File,
    @Body('source') source: string,
  ) {
    return this.novelsService.importNovelFromTxt(file, source);
  }

  @Get(':indentifier')
  async findOne(@Param('identifier') identifier: string) {
    const novel = await this.novelsService.findNovelBySlugOrId(identifier);

    if (!novel) {
      throw new NotFoundException('Novel not found');
    }

    return novel;
  }

  @Get(':novelId/chapters')
  findChaptersByNovelId(
    @Param('novelId') novelId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ) {
    return this.novelsService.paginateNovelChapters(novelId, pageOptionsDto);
  }

  @Get(':novelId/chapters/:chapterNumber')
  async getMainChapter(
    @Param('novelId') novelId: string,
    @Param('chapterNumber', ParseIntPipe) chapterNumber: number,
  ) {
    return this.getChapter(novelId, chapterNumber, 0);
  }

  @Get(':novelId/chapters/:chapterNumber/:chapterSubNumber')
  async getSubChapter(
    @Param('novelId') novelId: string,
    @Param('chapterNumber', ParseIntPipe) chapterNumber: number,
    @Param('chapterSubNumber', ParseIntPipe) chapterSubNumber: number,
  ) {
    return this.getChapter(novelId, chapterNumber, chapterSubNumber);
  }

  private async getChapter(
    novelId: string,
    chapterNumber: number,
    chapterSubNumber: number,
  ) {
    const chapter =
      await this.novelsService.findChapterByNovelIdAndChapterNumber(
        novelId,
        chapterNumber,
        chapterSubNumber,
      );

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    return chapter;
  }
}
