import { Module } from '@nestjs/common';
import { NovelsModule } from '@/modules/novels/novels.module';
import { NovelImportService } from '@/modules/jobs/services/novel-import.service';
import { JobsController } from '@/modules/jobs/jobs.controller';
import { JobsService } from '@/modules/jobs/jobs.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from '@/modules/jobs/entities/job.entity';
import { NovelImportProcessor } from '@/modules/jobs/processors/novel-import.processor';
import { SearchModule } from '@/infrastructure/search/search.module';
import { JobFlowFactory } from '@/modules/jobs/factories/job-flow.factory';
import { NovelIndexService } from '@/modules/jobs/services/novel-index.service';
import { NovelIndexProcessor } from '@/modules/jobs/processors/novel-index.processor';

@Module({
  imports: [
    NovelsModule,
    TypeOrmModule.forFeature([Job]),
    SearchModule.register(),
  ],

  providers: [
    JobsService,
    NovelImportService,
    NovelImportProcessor,
    JobFlowFactory,
    NovelIndexService,
    NovelIndexProcessor,
  ],
  controllers: [JobsController],
})
export class JobsModule {}
