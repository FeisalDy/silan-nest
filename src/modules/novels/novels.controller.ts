import { Controller, Get, Param, Query } from '@nestjs/common';
import { NovelsService } from './novels.service';
import { PageOptionsDto } from '../../common/dto/page-options.dto';

@Controller('novels')
export class NovelsController {
  constructor(private readonly novelsService: NovelsService) {}

  @Get()
  async findAll(@Query() pageOptionsDto: PageOptionsDto) {
    return this.novelsService.paginateNovels(pageOptionsDto);
  }

  @Get(':indentifier')
  findOne(@Query('identifier') identifier: string) {
    return this.novelsService.findNovelBySlugOrId(identifier);
  }

  @Get(':novelId/chapters')
  findChaptersByNovelId(
    @Param('novelId') novelId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ) {
    return this.novelsService.paginateNovelChapters(novelId, pageOptionsDto);
  }
}
