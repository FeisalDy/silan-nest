import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Novel } from './entities/novel.entity';

import { PageOptionsDto } from '../../common/dto/page-options.dto';
import { PageMetaDto } from '../../common/dto/page-meta.dto';
import { PageDto } from '../../common/dto/page.dto';
import { NovelDto } from './dto/novel.dto';
import { isUUID } from 'class-validator';
import { Lang } from '../../common/constants/lang.constant';
import { Chapter } from './entities/chapter.entity';
import { ChapterDto } from './dto/chapter.dto';

@Injectable()
export class NovelsService {
  constructor(
    @InjectRepository(Novel)
    private novelsRepository: Repository<Novel>,

    @InjectRepository(Chapter)
    private chaptersRepository: Repository<Chapter>,
  ) {}

  async paginateNovels(
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<NovelDto>> {
    const lang = Lang.ENGLISH;
    const queryBuilder = this.novelsRepository.createQueryBuilder('novel');

    queryBuilder
      .leftJoinAndSelect(
        'novel.translations',
        'translation',
        'translation.language_code = :lang',
        { lang },
      )
      .leftJoinAndSelect('novel.author', 'author')
      .leftJoinAndSelect(
        'author.translations',
        'authorTrans',
        'authorTrans.language_code = :lang',
        { lang },
      )
      .leftJoinAndSelect('novel.aliases', 'alias');

    if (pageOptionsDto.q) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('translation.title ILIKE :q', {
            q: `%${pageOptionsDto.q}%`,
          }).orWhere('alias.alias_title ILIKE :q', {
            q: `%${pageOptionsDto.q}%`,
          });
        }),
      );
    }

    queryBuilder
      .orderBy('novel.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    const novelDtos = entities.map((novel) => this.mapNovelToDto(novel));

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    return new PageDto(novelDtos, pageMetaDto);
  }

  async findNovelBySlugOrId(identifier: string): Promise<NovelDto | null> {
    const lang = Lang.ENGLISH;
    const qb = this.novelsRepository
      .createQueryBuilder('novel')
      .leftJoinAndSelect(
        'novel.translations',
        'translation',
        'translation.language_code = :lang',
        { lang },
      )
      .leftJoinAndSelect('novel.author', 'author')
      .leftJoinAndSelect(
        'author.translations',
        'authorTrans',
        'authorTrans.language_code = :lang',
        { lang },
      )
      .leftJoinAndSelect('novel.aliases', 'alias');

    qb.where('translation.slug = :identifier', { identifier });

    if (isUUID(identifier)) {
      qb.orWhere('novel.id = :identifier', { identifier });
    }

    const novel = await qb.getOne();

    if (!novel) return null;

    return this.mapNovelToDto(novel);
  }

  async paginateNovelChapters(novelId: string, pageOptionsDto: PageOptionsDto) {
    const lang = Lang.ENGLISH;
    const qb = this.chaptersRepository.createQueryBuilder('chapter');

    qb.leftJoinAndSelect(
      'chapter.translations',
      'translation',
      'translation.language_code = :lang',
      { lang },
    ).where('chapter.novelId = :novelId', { novelId });

    qb.orderBy('chapter.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const itemCount = await qb.getCount();
    const { entities } = await qb.getRawAndEntities();

    const chapterDtos = entities.map((chapter) =>
      this.mapChapterToDto(chapter),
    );

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    return new PageDto(chapterDtos, pageMetaDto);
  }

  private mapNovelToDto(novel: Novel): NovelDto {
    const trans = novel.translations?.[0];
    const authTrans = novel.author?.translations?.[0];

    return {
      id: novel.id,
      title: trans?.title || 'Untitled',
      slug: trans?.slug || '',
      synopsis: trans?.synopsis || '',
      coverUrl: novel.coverUrl,
      status: novel.status,
      languageCode: trans?.languageCode,
      createdAt: novel.createdAt,
      aliases: novel.aliases?.map((a) => a.aliasTitle) || [],
      author: novel.author
        ? {
            id: novel.author.id,
            name: authTrans?.name ?? 'Unknown Author',
            photoUrl: novel.author.photoUrl ?? null,
            biography: authTrans?.biography ?? '',
          }
        : null,
    };
  }

  private mapChapterToDto(chapter: Chapter): ChapterDto {
    const trans = chapter.translations?.[0];

    return {
      id: chapter.id,
      novelId: chapter.novelId,
      chapterNumber: chapter.chapterNumber,
      volumeNumber: chapter.volumeNumber,
      languageCode: trans?.languageCode,
      title: trans?.title,
      content: trans?.content || '',
      createdAt: chapter.createdAt,
    };
  }
}
