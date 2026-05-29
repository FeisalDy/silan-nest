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
import { parserDefinitions } from '@/modules/novels/parsers/definitions';
import { NOVEL_PARSER_DEFINITIONS, NOVEL_PARSERS } from '@/modules/novels/parsers/parser.tokens';
import { ParserEngine } from '@/modules/novels/parsers/engine/parser-engine';
import { ConfiguredNovelParser } from '@/modules/novels/parsers/engine/configured-novel.parser';
import { ParserDefinition } from '@/modules/novels/parsers/engine/parser-definition';
import { ChapterBuilder } from '@/modules/novels/parsers/engine/chapter-builder';
import { ChapterExtractor } from '@/modules/novels/parsers/engine/chapter-extractor';
import { MetadataExtractor } from '@/modules/novels/parsers/engine/metadata-extractor';

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
    ParserEngine,
    MetadataExtractor,
    ChapterBuilder,
    ChapterExtractor,
    {
      provide: NOVEL_PARSER_DEFINITIONS,
      useValue: parserDefinitions,
    },
    {
      provide: NOVEL_PARSERS,
      useFactory: (engine: ParserEngine, definitions: ParserDefinition[]) =>
        definitions.map((definition) => new ConfiguredNovelParser(definition, engine)),
      inject: [ParserEngine, NOVEL_PARSER_DEFINITIONS],
    },
    NovelParserRegistry,
  ],
  exports: [TypeOrmModule, NovelsService, NovelParserRegistry],
  controllers: [NovelsController],
})
export class NovelsModule {}
