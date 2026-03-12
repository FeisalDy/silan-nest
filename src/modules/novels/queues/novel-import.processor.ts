import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Job } from 'bullmq';
import slugify from 'slugify';
import { pinyin } from 'pinyin';
import { Novel } from '../entities/novel.entity';
import { NovelTranslation } from '../entities/novel-translation.entity';
import { Chapter } from '../entities/chapter.entity';
import { ChapterTranslation } from '../entities/chapter-translation.entity';
import { Author } from '../entities/author.entity';
import { AuthorTranslation } from '../entities/author-translation.entity';
import {
  NOVEL_IMPORT_JOB,
  NOVEL_IMPORT_QUEUE,
  NovelImportJobPayload,
} from './novel-import.queue';

@Processor(NOVEL_IMPORT_QUEUE)
export class NovelImportProcessor extends WorkerHost {
  private readonly logger = new Logger(NovelImportProcessor.name);

  constructor(private readonly dataSource: DataSource) {
    super();
  }

  async process(job: Job<NovelImportJobPayload>): Promise<void> {
    if (job.name !== NOVEL_IMPORT_JOB) return;

    const { parsedNovel } = job.data;

    this.logger.log(`Processing import job #${job.id}: "${parsedNovel.title}"`);

    await this.dataSource.transaction(async (manager) => {
      let author: Author | null = null;

      if (parsedNovel.author) {
        author = await this.findOrCreateAuthor(
          manager,
          parsedNovel.author,
          parsedNovel.languageCode,
        );
      }

      const novel = manager.create(Novel, {
        status: parsedNovel.status,
        authorId: author?.id ?? null,
      });

      const savedNovel = await manager.save(novel);

      const slug = this.buildSlug(parsedNovel.title);

      await manager.save(
        manager.create(NovelTranslation, {
          novelId: savedNovel.id,
          languageCode: parsedNovel.languageCode,
          title: parsedNovel.title,
          synopsis: parsedNovel.synopsis,
          slug,
          isDefault: true,
        }),
      );

      for (const parsedChapter of parsedNovel.chapters) {
        const chapter = await manager.save(
          manager.create(Chapter, {
            novelId: savedNovel.id,
            chapterNumber: parsedChapter.chapterNumber,
            chapterSubNumber: parsedChapter.chapterSubNumber,
            volumeNumber: parsedChapter.volumeNumber,
          }),
        );

        await manager.save(
          manager.create(ChapterTranslation, {
            chapterId: chapter.id,
            languageCode: parsedNovel.languageCode,
            title: parsedChapter.title || null,
            content: parsedChapter.content,
          }),
        );
      }
    });

    this.logger.log(
      `Import complete for "${parsedNovel.title}" — ${parsedNovel.chapters.length} chapter(s) saved.`,
    );
  }

  /**
   * Find an existing author by name+language.
   * If not found, create a new Author and AuthorTranslation.
   */
  private async findOrCreateAuthor(
    manager: EntityManager,
    name: string,
    languageCode: string,
  ): Promise<Author> {
    const normalized = name.trim();

    const existingTranslation = await manager
      .getRepository(AuthorTranslation)
      .createQueryBuilder('translation')
      .leftJoinAndSelect('translation.author', 'author')
      .where('LOWER(translation.name) = LOWER(:name)', { name: normalized })
      .andWhere('translation.languageCode = :languageCode', {
        languageCode,
      })
      .getOne();

    if (existingTranslation) {
      return existingTranslation.author;
    }

    const author = await manager.save(manager.create(Author, {}));

    await manager.save(
      manager.create(AuthorTranslation, {
        authorId: author.id,
        languageCode,
        name: normalized,
        isDefault: true,
      }),
    );

    return author;
  }

  /**
   * Generate URL-safe slug
   */
  private buildSlug(title: string): string {
    const base = /\p{Script=Han}/u.test(title)
      ? pinyin(title, { style: 'normal' }).flat().join(' ')
      : title;

    const slug = slugify(base, {
      lower: true,
      strict: true,
      trim: true,
    });

    return slug || 'novel';
  }
}
