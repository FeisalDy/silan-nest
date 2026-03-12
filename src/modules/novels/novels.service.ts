import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { NovelTranslation } from './entities/novel-translation.entity';
import { AuthorTranslation } from './entities/author-translation.entity';
import { ChapterTranslation } from './entities/chapter-translation.entity';
import {
  NOVEL_TRANSLATION_JOB,
  NOVEL_TRANSLATION_QUEUE,
  NovelTranslationJobPayload,
} from './queues/novel-translation.queue';

@Injectable()
export class NovelsService {
  constructor(
    @InjectRepository(Novel)
    private novelsRepository: Repository<Novel>,

    @InjectRepository(Chapter)
    private chaptersRepository: Repository<Chapter>,

    @InjectQueue(NOVEL_IMPORT_QUEUE)
    private novelImportQueue: Queue<NovelImportJobPayload>,

    @InjectQueue(NOVEL_TRANSLATION_QUEUE)
    private novelTranslationQueue: Queue<NovelTranslationJobPayload>,
  ) {}

  async paginateNovels(pageOptionsDto: PageOptionsDto) {
    const baseQuery = () => {
      const qb = this.novelsRepository
        .createQueryBuilder('novel')
        .leftJoinAndSelect(
          'novel.translations',
          'translation',
          'translation.language_code = :lang OR translation.is_default = true',
          { lang: Lang.ENGLISH },
        )
        .leftJoinAndSelect('novel.author', 'author')
        .leftJoinAndSelect(
          'author.translations',
          'authorTrans',
          'authorTrans.language_code = :lang OR authorTrans.is_default = true',
          { lang: Lang.ENGLISH },
        )
        .leftJoinAndSelect('novel.aliases', 'alias');

      if (pageOptionsDto.q) {
        qb.andWhere(
          new Brackets((inner) => {
            inner
              .where('translation.title ILIKE :q', {
                q: `%${pageOptionsDto.q}%`,
              })
              .orWhere('alias.alias_title ILIKE :q', {
                q: `%${pageOptionsDto.q}%`,
              });
          }),
        );
      }

      return qb;
    };

    const itemCount = await baseQuery().getCount();

    const { entities } = await baseQuery()
      .orderBy('novel.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take)
      .getRawAndEntities();

    const novelDtos = entities.map((novel) => this.mapNovelToDto(novel));

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    return new PageDto(novelDtos, pageMetaDto);
  }

  async findNovelBySlugOrId(identifier: string) {
    const qb = this.novelsRepository
      .createQueryBuilder('novel')
      .leftJoinAndSelect(
        'novel.translations',
        'translation',
        'translation.language_code = :lang OR translation.is_default = true',
        { lang: Lang.ENGLISH },
      )
      .leftJoinAndSelect('novel.author', 'author')
      .leftJoinAndSelect(
        'author.translations',
        'authorTrans',
        'authorTrans.language_code = :lang OR authorTrans.is_default = true',
        { lang: Lang.ENGLISH },
      )
      .leftJoinAndSelect('novel.aliases', 'alias');

    qb.where('translation.slug = :slug', { slug: identifier });

    if (isUUID(identifier)) {
      qb.orWhere('novel.id = :id', { id: identifier });
    }

    const novel = await qb.getOne();

    if (!novel) return null;

    return this.mapNovelToDto(novel);
  }

  async paginateNovelChapters(novelId: string, pageOptionsDto: PageOptionsDto) {
    const baseQuery = () =>
      this.chaptersRepository
        .createQueryBuilder('chapter')
        .leftJoinAndSelect('chapter.translations', 'translation')
        .where('chapter.novel_id = :novelId', { novelId });

    const itemCount = await baseQuery().getCount();

    const { entities } = await baseQuery()
      .orderBy('chapter.volumeNumber', pageOptionsDto.order)
      .addOrderBy('chapter.chapterNumber', pageOptionsDto.order)
      .addOrderBy('chapter.chapterSubNumber', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take)
      .getRawAndEntities();

    const chapterDtos = entities.map((chapter) =>
      this.mapChapterToDto(chapter, 240),
    );

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    return new PageDto(chapterDtos, pageMetaDto);
  }

  async findChapter(
    novelId: string,
    volumeNumber: number,
    chapterNumber: number,
    chapterSubNumber: number,
  ) {
    const qb = this.chaptersRepository.createQueryBuilder('chapter');

    qb.leftJoinAndSelect('chapter.translations', 'translation')
      .where('chapter.novel_id = :novelId', { novelId })
      .andWhere('chapter.volume_number = :volumeNumber', { volumeNumber })
      .andWhere('chapter.chapter_number = :chapterNumber', { chapterNumber })
      .andWhere('chapter.chapter_sub_number = :chapterSubNumber', {
        chapterSubNumber,
      });

    const chapter = await qb.getOne();

    if (!chapter) return null;

    const [prev, next] = await Promise.all([
      this.findPrevChapter(
        novelId,
        chapter.volumeNumber,
        chapterNumber,
        chapterSubNumber,
      ),
      this.findNextChapter(
        novelId,
        chapter.volumeNumber,
        chapterNumber,
        chapterSubNumber,
      ),
    ]);

    const dto = this.mapChapterToDto(chapter);

    dto.navigation = {
      prev: prev
        ? {
            volumeNumber: prev.volumeNumber,
            chapterNumber: prev.chapterNumber,
            chapterSubNumber: prev.chapterSubNumber,
          }
        : null,
      next: next
        ? {
            volumeNumber: next.volumeNumber,
            chapterNumber: next.chapterNumber,
            chapterSubNumber: next.chapterSubNumber,
          }
        : null,
    };

    return dto;
  }

  async findNextChapter(
    novelId: string,
    volumeNumber: number,
    chapterNumber: number,
    chapterSubNumber: number,
  ) {
    return this.chaptersRepository
      .createQueryBuilder('chapter')
      .where('chapter.novel_id = :novelId', { novelId })
      .andWhere(
        '(chapter.volume_number, chapter.chapter_number, chapter.chapter_sub_number) > (:volumeNumber, :chapterNumber, :chapterSubNumber)',
        { volumeNumber, chapterNumber, chapterSubNumber },
      )
      .orderBy('chapter.volume_number', 'ASC')
      .addOrderBy('chapter.chapter_number', 'ASC')
      .addOrderBy('chapter.chapter_sub_number', 'ASC')
      .limit(1)
      .getOne();
  }

  async findPrevChapter(
    novelId: string,
    volumeNumber: number,
    chapterNumber: number,
    chapterSubNumber: number,
  ) {
    return this.chaptersRepository
      .createQueryBuilder('chapter')
      .where('chapter.novel_id = :novelId', { novelId })
      .andWhere(
        '(chapter.volume_number, chapter.chapter_number, chapter.chapter_sub_number) < (:volumeNumber, :chapterNumber, :chapterSubNumber)',
        { volumeNumber, chapterNumber, chapterSubNumber },
      )
      .orderBy('chapter.volume_number', 'DESC')
      .addOrderBy('chapter.chapter_number', 'DESC')
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

  async getImportJobStatus(jobId: string): Promise<{
    jobId: string;
    status: string;
    failedReason?: string;
  }> {
    const job = await this.novelImportQueue.getJob(jobId);

    if (!job) {
      return { jobId, status: 'Job not Found' };
    }

    const state = await job.getState();
    const result: { jobId: string; status: string; failedReason?: string } = {
      jobId,
      status: state,
    };

    if (state === 'failed') {
      result.failedReason = job.failedReason ?? 'Unknown error';
    }

    return result;
  }

  async queueTranslation(payload: NovelTranslationJobPayload) {
    const novel = await this.novelsRepository.findOneBy({
      id: payload.novelId,
    });

    if (!novel) {
      throw new NotFoundException('Novel not found');
    }

    const jobId = `translate-${payload.novelId}`;
    const existingJob = await this.novelTranslationQueue.getJob(jobId);
    if (existingJob) {
      const state = await existingJob.getState();

      if (state === 'waiting' || state === 'active') {
        throw new BadRequestException('Translation already in progress');
      }

      await existingJob.remove();
    }
    const job = await this.novelTranslationQueue.add(
      NOVEL_TRANSLATION_JOB,
      payload,
      { jobId },
    );

    return {
      status: 'queued',
      jobId: job.id,
    };
  }

  async getTranslationJobStatus(novelId: string) {
    const jobId = `translate-${novelId}`;
    const job = await this.novelTranslationQueue.getJob(jobId);
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    const state = await job.getState();
    const result: { jobId: string; status: string; failedReason?: string } = {
      jobId,
      status: state,
    };

    if (state === 'failed') {
      result.failedReason = job.failedReason ?? 'Unknown error';
    }

    return result;
  }
  private pickTranslation<
    T extends { languageCode: string; isDefault?: boolean },
  >(translations: T[] | undefined): T | undefined {
    if (!translations?.length) return undefined;
    return (
      translations.find((t) => t.languageCode === (Lang.ENGLISH as string)) ??
      translations.find((t) => t.isDefault) ??
      translations[0]
    );
  }

  private pickChapterTranslation(
    translations: ChapterTranslation[] | undefined,
  ) {
    if (!translations?.length) return undefined;
    return (
      translations.find((t) => t.languageCode === (Lang.ENGLISH as string)) ??
      translations[0]
    );
  }

  private mapNovelToDto(novel: Novel): NovelDto {
    const trans = this.pickTranslation<NovelTranslation>(novel.translations);
    const authTrans = this.pickTranslation<AuthorTranslation>(
      novel.author?.translations,
    );

    return {
      id: novel.id,
      title: trans?.title || 'Untitled',
      slug: trans?.slug || '',
      synopsis: trans?.synopsis || '',
      coverUrl: novel.coverUrl,
      status: novel.status,
      languageCode: trans?.languageCode ?? '',
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
    const translation = this.pickChapterTranslation(chapter.translations);

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
      languageCode: translation?.languageCode ?? '',
      title: translation?.title ?? null,
      content: content ?? '',
      createdAt: chapter.createdAt,
    };
  }
}
