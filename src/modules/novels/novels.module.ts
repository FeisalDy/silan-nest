import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Novel } from './entities/novel.entity.js';
import { NovelTranslation } from './entities/novel-translation.entity.js';
import { NovelAlias } from './entities/novel-alias.entity.js';
import { Chapter } from './entities/chapter.entity.js';
import { ChapterTranslation } from './entities/chapter-translation.entity.js';
import { Author } from './entities/author.entity.js';
import { AuthorTranslation } from './entities/author-translation.entity.js';
import { NovelsService } from './novels.service.js';
import { NovelsController } from './novels.controller';
import { NOVEL_IMPORT_QUEUE } from './queues/novel-import.queue';
import { NovelImportProcessor } from './queues/novel-import.processor';

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
    BullModule.registerQueue({ name: NOVEL_IMPORT_QUEUE }),
  ],
  providers: [NovelsService, NovelImportProcessor],
  exports: [TypeOrmModule, NovelsService],
  controllers: [NovelsController],
})
export class NovelsModule {}
