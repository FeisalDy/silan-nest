import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Novel } from './entities/novel.entity';

import { PageOptionsDto } from '../../common/dto/page-options.dto';
import { PageMetaDto } from '../../common/dto/page-meta.dto';
import { PageDto } from '../../common/dto/page.dto';

@Injectable()
export class NovelsService {
  constructor(
    @InjectRepository(Novel)
    private novelsRepository: Repository<Novel>,
  ) {}

  async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<Novel>> {
    const queryBuilder = this.novelsRepository.createQueryBuilder('novel');

    if (pageOptionsDto.q) {
      queryBuilder
        .leftJoin('novel.aliases', 'alias')
        .where('alias.aliasTitle ILIKE :q', { q: `%${pageOptionsDto.q}%` });
    }

    queryBuilder
      .orderBy('novel.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    return new PageDto(entities, pageMetaDto);
  }
}
