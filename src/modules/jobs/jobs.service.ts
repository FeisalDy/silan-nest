import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import {
  NOVEL_IMPORT_JOB,
  NOVEL_IMPORT_QUEUE,
  NovelImportJobPayload,
} from '@/infrastructure/bullmq/queues/novel-import.queue';
import { Queue } from 'bullmq';
import { NovelParserRegistry } from '@/modules/novels/parsers/novel-parser.registry';
import { NovelTitleGenerator } from '@/common/utils/novel-title-generator.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from '@/modules/jobs/entities/job.entity';
import { DataSource, Repository } from 'typeorm';
import { JobEntity, JobStatus, JobType } from '@/common/constants/job.constant';
import {
  NOVEL_TRANSLATION_JOB,
  NOVEL_TRANSLATION_QUEUE,
  NovelTranslationJobPayload,
} from '@/infrastructure/bullmq/queues/novel-translation.queue';
import { NovelsService } from '@/modules/novels/novels.service';
import { UpdateJobStatusDto } from '@/modules/jobs/dto/update-status.dto';
import { Lang } from '@/common/constants/lang.constant';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job) private jobsRepository: Repository<Job>,
    @InjectQueue(NOVEL_IMPORT_QUEUE)
    private readonly novelImportQueue: Queue<NovelImportJobPayload>,
    @InjectQueue(NOVEL_TRANSLATION_QUEUE)
    private readonly novelTranslateQueue: Queue<NovelTranslationJobPayload>,
    private readonly parserRegistry: NovelParserRegistry,
    private readonly dataSource: DataSource,
    private readonly novelService: NovelsService
  ) {}

  previewNovelImport(
    file: Express.Multer.File,
    source: string,
    chapterLimit?: number
  ) {
    const text = file.buffer.toString('utf8');
    const parser = this.parserRegistry.get(source);
    return parser.parse(text, chapterLimit);
  }

  async enqueueNovelImport(file: Express.Multer.File, source: string) {
    const parsedNovel = this.previewNovelImport(file, source);

    if (!parsedNovel.title) {
      parsedNovel.title = NovelTitleGenerator.generate({
        fileName: file.originalname,
        firstChapterTitle: parsedNovel.chapters[0]?.title,
        languageCode: parsedNovel.languageCode,
      });
    }

    return await this.dataSource.transaction(async (manager) => {
      const payloadNovel = {
        ...parsedNovel,
        chapters: parsedNovel.chapters.slice(0, 2),
        synopsis:
          parsedNovel.synopsis && parsedNovel.synopsis.length > 300
            ? `${parsedNovel.synopsis.substring(0, 300)}...`
            : parsedNovel.synopsis,
      };

      const dbJob = manager.create(Job, {
        type: JobType.IMPORT_NOVEL,
        status: JobStatus.WAITING,
        entityType: JobEntity.NOVEL,
        payload: {
          source,
          parsedNovel: payloadNovel,
        },
        attempts: 0,
      });

      const savedDbJob = await manager.save(Job, dbJob);

      const bullmqJob = await this.novelImportQueue.add(NOVEL_IMPORT_JOB, {
        dbJobId: savedDbJob.id,
        source,
        parsedNovel,
      });

      savedDbJob.queueJobId = bullmqJob.id;
      await manager.save(Job, savedDbJob);

      return {
        status: JobStatus.WAITING,
        jobId: savedDbJob.id,
      };
    });
  }

  async enqueueNovelTranslate(novelId: string, targetLang: Lang) {
    const novel = await this.novelService.findNovelBySlugOrId(novelId);

    if (!novel) {
      throw new NotFoundException('Novel not found');
    }

    return await this.dataSource.transaction(async (manager) => {
      const dbJob = manager.create(Job, {
        type: JobType.TRANSLATE_NOVEL,
        status: JobStatus.WAITING,
        entityType: JobEntity.NOVEL,
        entityId: novel.id,
        payload: {
          novelId,
          targetLang,
        },
        attempts: 0,
      });

      const savedDbJob = await manager.save(Job, dbJob);

      //TODO: Add FlowProducer to make translate job as child and index as parent. make sure that if the elastic seach is not enabled, dont let the nestJS processor handle the work, let the job still waiting
      const bullmqJob = await this.novelTranslateQueue.add(
        NOVEL_TRANSLATION_JOB,
        {
          dbJobId: savedDbJob.id,
          novelId: novelId,
          targetLang: targetLang,
        }
      );

      savedDbJob.queueJobId = bullmqJob.id;
      await manager.save(Job, savedDbJob);

      return {
        status: JobStatus.WAITING,
        jobId: savedDbJob.id,
      };
    });
  }

  async getJob(jobId: string) {
    const job = await this.jobsRepository.findOneBy({ id: jobId });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  async markRunning(jobId: string, attempts: number) {
    await this.jobsRepository.update(jobId, {
      status: JobStatus.RUNNING,
      startedAt: new Date(),
      attempts,
    });
  }

  async markCompleted(jobId: string, attempts: number) {
    await this.jobsRepository.update(jobId, {
      status: JobStatus.COMPLETED,
      completedAt: new Date(),
      attempts,
    });
  }

  async markFailed(jobId: string, error: Error, attempts: number) {
    await this.jobsRepository.update(jobId, {
      status: JobStatus.FAILED,
      failedAt: new Date(),
      attempts,
      errorMessage: error.message,
      errorStack: error.stack,
    });
  }

  async attachEntity(jobId: string, entityType: JobEntity, entityId: string) {
    await this.jobsRepository.update(jobId, {
      entityType,
      entityId,
    });
  }

  async updateStatus(jobId: string, payload: UpdateJobStatusDto) {
    await this.jobsRepository.update(jobId, payload);
  }
}
