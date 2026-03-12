import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Novel } from './entities/novel.entity';
import { NovelTranslation } from './entities/novel-translation.entity';
import { NovelAlias } from './entities/novel-alias.entity';
import { Chapter } from './entities/chapter.entity';
import { ChapterTranslation } from './entities/chapter-translation.entity';
import { Author } from './entities/author.entity';
import { AuthorTranslation } from './entities/author-translation.entity';
import { NovelsService } from './novels.service';
import { NovelsController } from './novels.controller';
import { NOVEL_IMPORT_QUEUE } from './queues/novel-import.queue';
import { NovelImportProcessor } from './queues/novel-import.processor';
import { NOVEL_TRANSLATION_QUEUE } from './queues/novel-translation.queue';

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
    BullModule.registerQueue(
      { name: NOVEL_IMPORT_QUEUE },
      { name: NOVEL_TRANSLATION_QUEUE },
    ),
  ],
  providers: [NovelsService, NovelImportProcessor],
  exports: [TypeOrmModule, NovelsService],
  controllers: [NovelsController],
})
export class NovelsModule {}
