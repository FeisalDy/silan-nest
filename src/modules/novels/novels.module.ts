import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Novel } from './entities/novel.entity';
import { NovelTranslation } from './entities/novel-translation.entity';
import { NovelAlias } from './entities/novel-alias.entity';
import { Chapter } from './entities/chapter.entity';
import { ChapterTranslation } from './entities/chapter-translation.entity';
import { Author } from './entities/author.entity';
import { AuthorTranslation } from './entities/author-translation.entity';
import { NovelsService } from './novels.service';
import { NovelsController } from './novels.controller';
import { SearchModule } from '@/infrastructure/search/search.module';
import { NovelParserRegistry } from '@/modules/novels/parsers/novel-parser.registry';
import { SfacgMetaChapterV1Parser } from '@/modules/novels/parsers/sfacg-meta-chapter-v1.parser';
import { GenericCnChapterV1Parser } from '@/modules/novels/parsers/generic-cn-chapter-v1.parser';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Novel,
      NovelTranslation,
      NovelAlias,
      Chapter,
      ChapterTranslation,
      Author,
      AuthorTranslation,
    ]),
    SearchModule.register(),
  ],
  providers: [
    NovelsService,
    SfacgMetaChapterV1Parser,
    GenericCnChapterV1Parser,
    NovelParserRegistry,
  ],
  exports: [TypeOrmModule, NovelsService, NovelParserRegistry],
  controllers: [NovelsController],
})
export class NovelsModule {}
