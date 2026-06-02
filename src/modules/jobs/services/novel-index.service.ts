import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Chapter } from '@/modules/novels/entities/chapter.entity';
import { Repository } from 'typeorm';
import { Lang } from '@/common/constants/lang.constant';
import { SearchService } from '@/infrastructure/search/search.service';

@Injectable()
export class NovelIndexService {
  private logger = new Logger(NovelIndexService.name);
  constructor(
    @InjectRepository(Chapter) private chaptersRepository: Repository<Chapter>,
    private readonly searchService: SearchService
  ) {}

  async execute({
    novelId,
    lang,
  }: {
    novelId: string;
    lang: Lang;
  }): Promise<void> {
    this.logger.log('Execute index running');
    const chapters = await this.findChapterByNovelIdAndLanguageCode(
      novelId,
      lang
    );
    this.logger.log('Chapters running', chapters.slice(0, 2));
    const documents = this.buildIndexedDocument(chapters);
    this.logger.log('Documents running', documents.slice(0, 2));

    if (documents.length > 0) {
      this.logger.log('bulkIndexChapters running');
      await this.searchService.bulkIndexChapters(documents);
    }
  }

  private async findChapterByNovelIdAndLanguageCode(
    novelId: string,
    lang: Lang
  ) {
    return await this.chaptersRepository
      .createQueryBuilder('chapter')
      .innerJoinAndSelect(
        'chapter.translations',
        'translations',
        'translations.language_code = :lang',
        { lang }
      )
      .where('chapter.novel_id = :novelId', { novelId })
      .getMany();
  }

  private buildIndexedDocument(chapters: Chapter[]) {
    return chapters.flatMap((chapter) =>
      chapter.translations.flatMap((translation) => {
        if (!translation.content) {
          return [];
        }

        return [
          {
            id: translation.id,

            languageCode: translation.languageCode,

            document: {
              id: translation.id,
              chapterId: chapter.id,
              languageCode: translation.languageCode,
              content: this.normalizeSearchContent(translation.content),
            },
          },
        ];
      })
    );
  }

  // private buildIndexedDocument(chapters: Chapter[]) {
  //   return chapters.flatMap((chapter) => {
  //     const translation = chapter.translations.find(
  //       (t) => (t.languageCode as Lang) === Lang.ENGLISH
  //     );
  //
  //     if (!translation?.content) {
  //       return [];
  //     }
  //
  //     return [
  //       {
  //         id: translation.id,
  //
  //         document: {
  //           id: translation.id,
  //
  //           chapterId: chapter.id,
  //
  //           languageCode: translation.languageCode,
  //
  //           content: this.normalizeSearchContent(translation.content),
  //         },
  //       },
  //     ];
  //   });
  // }

  private normalizeSearchContent(content: string): string {
    return content
      .replace(/\r/g, ' ')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
