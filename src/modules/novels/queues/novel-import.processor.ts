import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { Novel } from '../entities/novel.entity';
import { NovelTranslation } from '../entities/novel-translation.entity';
import { Chapter } from '../entities/chapter.entity';
import { ChapterTranslation } from '../entities/chapter-translation.entity';
import {
  NOVEL_IMPORT_JOB,
  NOVEL_IMPORT_QUEUE,
  NovelImportJobPayload,
} from './novel-import.queue';
import { Lang } from '../../../common/constants/lang.constant';

@Processor(NOVEL_IMPORT_QUEUE)
export class NovelImportProcessor extends WorkerHost {
  private readonly logger = new Logger(NovelImportProcessor.name);

  constructor(
    @InjectRepository(Novel)
    private readonly novelsRepository: Repository<Novel>,

    @InjectRepository(NovelTranslation)
    private readonly novelTranslationsRepository: Repository<NovelTranslation>,

    @InjectRepository(Chapter)
    private readonly chaptersRepository: Repository<Chapter>,

    @InjectRepository(ChapterTranslation)
    private readonly chapterTranslationsRepository: Repository<ChapterTranslation>,
  ) {
    super();
  }

  async process(job: Job<NovelImportJobPayload>): Promise<void> {
    if (job.name !== NOVEL_IMPORT_JOB) return;

    const { parsedNovel } = job.data;
    this.logger.log(`Processing import job #${job.id}: "${parsedNovel.title}"`);

    const novel = this.novelsRepository.create({ status: 'ongoing' });
    const savedNovel = await this.novelsRepository.save(novel);

    const slug = this.buildSlug(parsedNovel.title);

    await this.novelTranslationsRepository.save(
      this.novelTranslationsRepository.create({
        novelId: savedNovel.id,
        languageCode: Lang.ENGLISH,
        title: parsedNovel.title,
        synopsis: parsedNovel.synopsis || null,
        slug,
        isDefault: true,
      }),
    );

    for (const parsedChapter of parsedNovel.chapters) {
      const chapter = await this.chaptersRepository.save(
        this.chaptersRepository.create({
          novelId: savedNovel.id,
          chapterNumber: parsedChapter.chapterNumber,
          chapterSubNumber: parsedChapter.chapterSubNumber,
        }),
      );

      await this.chapterTranslationsRepository.save(
        this.chapterTranslationsRepository.create({
          chapterId: chapter.id,
          languageCode: Lang.ENGLISH,
          title: parsedChapter.title || null,
          content: parsedChapter.content,
        }),
      );
    }

    this.logger.log(
      `Import complete for "${parsedNovel.title}" — ${parsedNovel.chapters.length} chapter(s) saved.`,
    );
  }

  private buildSlug(title: string): string {
    return (
      title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-') +
      '-' +
      Date.now()
    );
  }
}
