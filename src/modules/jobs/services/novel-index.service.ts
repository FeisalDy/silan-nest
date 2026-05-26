import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Chapter } from '@/modules/novels/entities/chapter.entity';
import { Repository } from 'typeorm';
import { Lang } from '@/common/constants/lang.constant';
import { SearchService } from '@/infrastructure/search/search.service';

@Injectable()
export class NovelIndexService {
  constructor(
    @InjectRepository(Chapter) private chaptersRepository: Repository<Chapter>,
    private readonly searchService: SearchService
  ) {}

  async execute(novelId: string) {
    const chapters = await this.findAllEnglishChapterByNovelId(novelId);
    const documents = this.buildIndexedDocument(chapters);

    if (documents.length > 0) {
      await this.searchService.bulkIndexChapters(documents);
    }
  }

  private async findAllEnglishChapterByNovelId(novelId: string) {
    return await this.chaptersRepository
      .createQueryBuilder('chapter')
      .innerJoinAndSelect(
        'chapter.translations',
        'translation',
        'translation.language_code = :lang',
        { lang: Lang.ENGLISH }
      )
      .where('chapter.novel_id = :novelId', { novelId })
      .getMany();
  }

  private buildIndexedDocument(chapters: Chapter[]) {
    return chapters.flatMap((chapter) => {
      const translation = chapter.translations.find(
        (t) => (t.languageCode as Lang) === Lang.ENGLISH
      );

      if (!translation?.content) {
        return [];
      }

      return [
        {
          id: translation.id,

          document: {
            id: translation.id,

            chapterId: chapter.id,

            languageCode: translation.languageCode,

            content: this.normalizeSearchContent(translation.content),
          },
        },
      ];
    });
  }

  private normalizeSearchContent(content: string): string {
    return content
      .replace(/\r/g, ' ')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
