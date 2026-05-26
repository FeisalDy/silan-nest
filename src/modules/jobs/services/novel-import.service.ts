import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { ParsedNovel } from '@/modules/novels/interfaces/parsed-novel.interface';

import { Novel } from '@/modules/novels/entities/novel.entity';
import { NovelTranslation } from '@/modules/novels/entities/novel-translation.entity';

import { Chapter } from '@/modules/novels/entities/chapter.entity';
import { ChapterTranslation } from '@/modules/novels/entities/chapter-translation.entity';

import { Author } from '@/modules/novels/entities/author.entity';
import { AuthorTranslation } from '@/modules/novels/entities/author-translation.entity';

import { BuildSlug } from '@/common/utils/build-novel-slug.util';

@Injectable()
export class NovelImportService {
  constructor(private readonly dataSource: DataSource) {}

  async execute(parsedNovel: ParsedNovel) {
    return this.dataSource.transaction(async (manager) => {
      let author: Author | null = null;

      if (parsedNovel.author) {
        author = await this.findOrCreateAuthor(
          manager,
          parsedNovel.author,
          parsedNovel.languageCode
        );
      }

      const novel = manager.create(Novel, {
        status: parsedNovel.status ?? null,
        authorId: author?.id ?? null,
      });

      const savedNovel = await manager.save(Novel, novel);

      const slug = BuildSlug(parsedNovel.title!);

      await manager.save(
        NovelTranslation,
        manager.create(NovelTranslation, {
          novelId: savedNovel.id,
          languageCode: parsedNovel.languageCode,
          title: parsedNovel.title!,
          synopsis: parsedNovel.synopsis,
          slug,
          isDefault: true,
        })
      );

      for (const parsedChapter of parsedNovel.chapters) {
        const chapter = await manager.save(
          Chapter,
          manager.create(Chapter, {
            novelId: savedNovel.id,
            chapterNumber: parsedChapter.chapterNumber,
            chapterSubNumber: parsedChapter.chapterSubNumber,
            volumeNumber: parsedChapter.volumeNumber,
          })
        );

        await manager.save(
          ChapterTranslation,
          manager.create(ChapterTranslation, {
            chapterId: chapter.id,
            languageCode: parsedNovel.languageCode,
            title: parsedChapter.title || null,
            content: parsedChapter.content,
            isDefault: true,
          })
        );
      }

      return savedNovel;
    });
  }

  /**
   * Find existing author translation
   * or create new author + translation.
   */
  private async findOrCreateAuthor(
    manager: EntityManager,
    name: string,
    languageCode: string
  ): Promise<Author> {
    const normalized = name.trim();

    const existingTranslation = await manager
      .getRepository(AuthorTranslation)
      .createQueryBuilder('translation')
      .leftJoinAndSelect('translation.author', 'author')
      .where('LOWER(translation.name) = LOWER(:name)', { name: normalized })
      .andWhere('translation.languageCode = :languageCode', { languageCode })
      .getOne();

    if (existingTranslation) {
      return existingTranslation.author;
    }

    const author = await manager.save(Author, manager.create(Author, {}));

    await manager.save(
      AuthorTranslation,
      manager.create(AuthorTranslation, {
        authorId: author.id,
        languageCode,
        name: normalized,
        isDefault: true,
      })
    );

    return author;
  }
}
