import { Module } from '@nestjs/common';
import { NovelsModule } from '@/modules/novels/novels.module';
import { NovelImportService } from '@/modules/jobs/services/novel-import.service';
import { JobsController } from '@/modules/jobs/jobs.controller';
import { JobsService } from '@/modules/jobs/jobs.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from '@/modules/jobs/entities/job.entity';
import { NovelImportProcessor } from '@/modules/jobs/processors/novel-import.processor';

@Module({
  imports: [NovelsModule, TypeOrmModule.forFeature([Job])],

  providers: [JobsService, NovelImportService, NovelImportProcessor],
  controllers: [JobsController],
})
export class JobsModule {}
