import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Novel } from './entities/novel.entity';
import { NovelParserFactory } from './parsers/novel-parser.factory';
import {
  NOVEL_IMPORT_JOB,
  NOVEL_IMPORT_QUEUE,
  NovelImportJobPayload,
} from './queues/novel-import.queue';

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

    @InjectQueue(NOVEL_IMPORT_QUEUE)
    private novelImportQueue: Queue<NovelImportJobPayload>,
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

    qb.orderBy(
      'chapter.chapter_number, chapter.chapter_sub_number ',
      pageOptionsDto.order,
    )
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const itemCount = await qb.getCount();
    const { entities } = await qb.getRawAndEntities();

    const chapterDtos = entities.map((chapter) =>
      this.mapChapterToDto(chapter, 240),
    );

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    return new PageDto(chapterDtos, pageMetaDto);
  }

  async findChapterByNovelIdAndChapterNumber(
    novelId: string,
    chapterNumber: number,
    chapterSubNumber: number,
  ): Promise<ChapterDto | null> {
    const lang = Lang.ENGLISH;
    const qb = this.chaptersRepository.createQueryBuilder('chapter');

    qb.leftJoinAndSelect(
      'chapter.translations',
      'translation',
      'translation.language_code = :lang',
      { lang },
    )
      .where('chapter.novel_id = :novelId', { novelId })
      .andWhere('chapter.chapter_number = :chapterNumber', { chapterNumber })
      .andWhere('chapter.chapter_sub_number = :chapterSubNumber', {
        chapterSubNumber,
      });

    const chapter = await qb.getOne();

    if (!chapter) return null;

    const [prev, next] = await Promise.all([
      this.findPrevChapter(novelId, chapterNumber, chapterSubNumber),
      this.findNextChapter(novelId, chapterNumber, chapterSubNumber),
    ]);

    const dto = this.mapChapterToDto(chapter);

    dto.navigation = {
      prev: prev
        ? {
            chapterNumber: prev.chapterNumber,
            chapterSubNumber: prev.chapterSubNumber,
          }
        : null,
      next: next
        ? {
            chapterNumber: next.chapterNumber,
            chapterSubNumber: next.chapterSubNumber,
          }
        : null,
    };

    return dto;
  }

  async findNextChapter(
    novelId: string,
    chapterNumber: number,
    chapterSubNumber: number,
  ) {
    return this.chaptersRepository
      .createQueryBuilder('chapter')
      .where('chapter.novel_id = :novelId', { novelId })
      .andWhere(
        '(chapter.chapter_number, chapter.chapter_sub_number) > (:chapterNumber, :chapterSubNumber)',
        { chapterNumber, chapterSubNumber },
      )
      .orderBy('chapter.chapter_number', 'ASC')
      .addOrderBy('chapter.chapter_sub_number', 'ASC')
      .limit(1)
      .getOne();
  }

  async findPrevChapter(
    novelId: string,
    chapterNumber: number,
    chapterSubNumber: number,
  ) {
    return this.chaptersRepository
      .createQueryBuilder('chapter')
      .where('chapter.novel_id = :novelId', { novelId })
      .andWhere(
        '(chapter.chapter_number, chapter.chapter_sub_number) < (:chapterNumber, :chapterSubNumber)',
        { chapterNumber, chapterSubNumber },
      )
      .orderBy('chapter.chapter_number', 'DESC')
      .addOrderBy('chapter.chapter_sub_number', 'DESC')
      .limit(1)
      .getOne();
  }

  previewNovelFromTxt(file: Express.Multer.File, source: string) {
    const text = file.buffer.toString('utf-8');
    const parser = NovelParserFactory.create(source);
    return parser.parse(text);
  }

  async importNovelFromTxt(
    file: Express.Multer.File,
    source: string,
  ): Promise<{ status: string; jobId: string | undefined }> {
    const parsedNovel = this.previewNovelFromTxt(file, source);

    const job = await this.novelImportQueue.add(NOVEL_IMPORT_JOB, {
      source,
      parsedNovel,
    });

    return { status: 'queued', jobId: job.id };
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

  private mapChapterToDto(
    chapter: Chapter,
    truncateLength?: number,
  ): ChapterDto {
    const translation = chapter.translations?.[0];

    let content = translation?.content;

    if (truncateLength && content && content.length > truncateLength) {
      const clipped = content.slice(0, truncateLength);
      const lastSpace = clipped.lastIndexOf(' ');
      content =
        clipped.slice(0, lastSpace > 0 ? lastSpace : truncateLength) + '...';
    }

    return {
      id: chapter.id,
      novelId: chapter.novelId,
      chapterNumber: chapter.chapterNumber,
      chapterSubNumber: chapter.chapterSubNumber,
      volumeNumber: chapter.volumeNumber,
      languageCode: translation?.languageCode,
      title: translation?.title,
      content,
      createdAt: chapter.createdAt,
    };
  }
}
