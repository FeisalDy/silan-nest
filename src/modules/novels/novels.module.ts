import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Novel } from './entities/novel.entity.js';
import { NovelTranslation } from './entities/novel-translation.entity.js';
import { NovelAlias } from './entities/novel-alias.entity.js';
import { Chapter } from './entities/chapter.entity.js';
import { ChapterTranslation } from './entities/chapter-translation.entity.js';
import { NovelsService } from './novels.service.js';
import { NovelsController } from './novels.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Novel,
      NovelTranslation,
      NovelAlias,
      Chapter,
      ChapterTranslation,
    ]),
  ],
  providers: [NovelsService],
  exports: [TypeOrmModule, NovelsService],
  controllers: [NovelsController],
})
export class NovelsModule {}
