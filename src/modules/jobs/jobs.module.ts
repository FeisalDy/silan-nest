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
  ],
  controllers: [JobsController],
})
export class JobsModule {}
