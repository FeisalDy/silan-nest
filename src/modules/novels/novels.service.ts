import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Novel } from './entities/novel.entity';
import { PageOptionsDto } from '@/common/dto/page-options.dto';
import { PageMetaDto } from '@/common/dto/page-meta.dto';
import { PageDto } from '@/common/dto/page.dto';
import { NovelDto } from './dto/novel.dto';
import { isUUID } from 'class-validator';
import { Lang } from '@/common/constants/lang.constant';
import { Chapter } from './entities/chapter.entity';
import { ChapterDto } from './dto/chapter.dto';
import { NovelTranslation } from './entities/novel-translation.entity';
import { AuthorTranslation } from './entities/author-translation.entity';
import { ChapterTranslation } from './entities/chapter-translation.entity';
import { SearchService } from '@/infrastructure/search/search.service';

@Injectable()
export class NovelsService {
  constructor(
    @InjectRepository(Novel) private novelsRepository: Repository<Novel>,
    @InjectRepository(Chapter) private chaptersRepository: Repository<Chapter>,
    @InjectRepository(NovelTranslation)
    private novelTranslationRepository: Repository<NovelTranslation>,
    private readonly searchService: SearchService
  ) {}

  async hasTranslation(novelId: string, lang: Lang) {
    return await this.novelTranslationRepository.existsBy({
      novelId,
      languageCode: lang,
    });
  }

  async paginateNovels(pageOptionsDto: PageOptionsDto) {
    const baseQuery = () => {
      const qb = this.novelsRepository
        .createQueryBuilder('novel')
        .leftJoinAndSelect(
          'novel.translations',
          'translation',
          'translation.language_code = :lang OR translation.is_default = true',
          { lang: Lang.ENGLISH }
        )
        .leftJoinAndSelect('novel.author', 'author')
        .leftJoinAndSelect(
          'author.translations',
          'authorTrans',
          'authorTrans.language_code = :lang OR authorTrans.is_default = true',
          { lang: Lang.ENGLISH }
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
          })
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
        { lang: Lang.ENGLISH }
      )
      .leftJoinAndSelect('novel.author', 'author')
      .leftJoinAndSelect(
        'author.translations',
        'authorTrans',
        'authorTrans.language_code = :lang OR authorTrans.is_default = true',
        { lang: Lang.ENGLISH }
      )
      .leftJoinAndSelect('novel.aliases', 'alias');

    qb.where('translation.slug = :slug', { slug: identifier });

    if (isUUID(identifier)) {
      qb.orWhere('novel.id = :id', { id: identifier });
    }

    const novel = await qb.getOne();

    if (!novel) return null;

    const chapterCount = await this.chaptersRepository.count({
      where: { novelId: novel.id },
    });

    const dto = this.mapNovelToDto(novel);
    dto.chapterCount = chapterCount;
    return dto;
  }

  async searchNovelsByChapterKeyword(query: string): Promise<any[]> {
    const hits = await this.searchService.search(query);
    if (!hits.length) {
      return [];
    }

    const chapterHighlightMap = new Map<string, string[]>();
    for (const hit of hits) {
      const chId = hit.source.chapterId;
      if (hit.highlight && hit.highlight.content) {
        chapterHighlightMap.set(chId, hit.highlight.content);
      }
    }

    const chapterIds = Array.from(chapterHighlightMap.keys());
    if (!chapterIds.length) {
      return [];
    }

    const chapters = await this.chaptersRepository
      .createQueryBuilder('chapter')
      .where('chapter.id IN (:...chapterIds)', { chapterIds })
      .getMany();

    const novelChaptersMap = new Map<string, typeof chapters>();
    for (const chapter of chapters) {
      let list = novelChaptersMap.get(chapter.novelId);
      if (!list) {
        list = [];
        novelChaptersMap.set(chapter.novelId, list);
      }
      list.push(chapter);
    }

    const novelIds = Array.from(novelChaptersMap.keys());

    const novels = await this.novelsRepository
      .createQueryBuilder('novel')
      .leftJoinAndSelect(
        'novel.translations',
        'translation',
        'translation.language_code = :lang OR translation.is_default = true',
        { lang: Lang.ENGLISH }
      )
      .leftJoinAndSelect('novel.author', 'author')
      .leftJoinAndSelect(
        'author.translations',
        'authorTrans',
        'authorTrans.language_code = :lang OR authorTrans.is_default = true',
        { lang: Lang.ENGLISH }
      )
      .leftJoinAndSelect('novel.aliases', 'alias')
      .where('novel.id IN (:...novelIds)', { novelIds })
      .getMany();

    return novels.map((novel) => {
      const novelDto = this.mapNovelToDto(novel);
      const chs = novelChaptersMap.get(novel.id) || [];
      const chapterResults = chs.map((ch) => ({
        id: ch.id,
        volumeNumber: ch.volumeNumber,
        chapterNumber: ch.chapterNumber,
        chapterSubNumber: ch.chapterSubNumber,
        highlights: chapterHighlightMap.get(ch.id) || [],
      }));

      return {
        novel: novelDto,
        chapters: chapterResults,
      };
    });
  }

  async paginateNovelChapters(novelId: string, pageOptionsDto: PageOptionsDto) {
    const novel = await this.findNovelBySlugOrId(novelId);
    if (!novel) {
      throw new NotFoundException('Novel not found');
    }

    const baseQuery = () =>
      this.chaptersRepository
        .createQueryBuilder('chapter')
        .leftJoinAndSelect('chapter.translations', 'translation')
        .where('chapter.novel_id = :novelId', { novelId: novel.id });

    const itemCount = await baseQuery().getCount();

    const { entities } = await baseQuery()
      .orderBy('chapter.volumeNumber', pageOptionsDto.order)
      .addOrderBy('chapter.chapterNumber', pageOptionsDto.order)
      .addOrderBy('chapter.chapterSubNumber', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take)
      .getRawAndEntities();

    const chapterDtos = entities.map((chapter) =>
      this.mapChapterToDto(chapter, 240)
    );

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    return new PageDto(chapterDtos, pageMetaDto);
  }

  async findChapter(
    novelId: string,
    volumeNumber: number,
    chapterNumber: number,
    chapterSubNumber: number
  ) {
    const novel = await this.findNovelBySlugOrId(novelId);
    if (!novel) {
      throw new NotFoundException('Novel not found');
    }

    const qb = this.chaptersRepository.createQueryBuilder('chapter');

    qb.leftJoinAndSelect('chapter.translations', 'translation')
      .where('chapter.novel_id = :novelId', { novelId: novel.id })
      .andWhere('chapter.volume_number = :volumeNumber', { volumeNumber })
      .andWhere('chapter.chapter_number = :chapterNumber', { chapterNumber })
      .andWhere('chapter.chapter_sub_number = :chapterSubNumber', {
        chapterSubNumber,
      });

    const chapter = await qb.getOne();

    if (!chapter) return null;

    const [prev, next] = await Promise.all([
      this.findPrevChapter(
        novel.id,
        chapter.volumeNumber,
        chapterNumber,
        chapterSubNumber
      ),
      this.findNextChapter(
        novel.id,
        chapter.volumeNumber,
        chapterNumber,
        chapterSubNumber
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
    chapterSubNumber: number
  ) {
    return this.chaptersRepository
      .createQueryBuilder('chapter')
      .where('chapter.novel_id = :novelId', { novelId })
      .andWhere(
        '(chapter.volume_number, chapter.chapter_number, chapter.chapter_sub_number) > (:volumeNumber, :chapterNumber, :chapterSubNumber)',
        { volumeNumber, chapterNumber, chapterSubNumber }
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
    chapterSubNumber: number
  ) {
    return this.chaptersRepository
      .createQueryBuilder('chapter')
      .where('chapter.novel_id = :novelId', { novelId })
      .andWhere(
        '(chapter.volume_number, chapter.chapter_number, chapter.chapter_sub_number) < (:volumeNumber, :chapterNumber, :chapterSubNumber)',
        { volumeNumber, chapterNumber, chapterSubNumber }
      )
      .orderBy('chapter.volume_number', 'DESC')
      .addOrderBy('chapter.chapter_number', 'DESC')
      .addOrderBy('chapter.chapter_sub_number', 'DESC')
      .limit(1)
      .getOne();
  }

  private pickTranslation<
    T extends {
      languageCode: string;
      isDefault?: boolean;
    },
  >(translations: T[] | undefined): T | undefined {
    if (!translations?.length) return undefined;
    return (
      translations.find((t) => t.languageCode === (Lang.ENGLISH as string)) ??
      translations.find((t) => t.isDefault) ??
      translations[0]
    );
  }

  private pickChapterTranslation(
    translations: ChapterTranslation[] | undefined
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
      novel.author?.translations
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
            name: authTrans?.name ?? null,
            photoUrl: novel.author.photoUrl ?? null,
            biography: authTrans?.biography ?? null,
          }
        : null,
    };
  }

  private mapChapterToDto(
    chapter: Chapter,
    truncateLength?: number
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
