import { Controller, Get, Query } from '@nestjs/common';
import { NovelsService } from './novels.service';
import { PageOptionsDto } from '../../common/dto/page-options.dto';
import { PageDto } from '../../common/dto/page.dto';
import { Novel } from './entities/novel.entity';

@Controller('novels')
export class NovelsController {
  constructor(private readonly novelsService: NovelsService) {}

  @Get()
  async findAll(
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Novel>> {
    return this.novelsService.findAll(pageOptionsDto);
  }
}
