import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectFlowProducer, InjectQueue } from '@nestjs/bullmq';
import {
  NOVEL_IMPORT_JOB,
  NOVEL_IMPORT_QUEUE,
  NovelImportJobPayload,
} from '@/infrastructure/bullmq/queues/novel-import.queue';
import { FlowProducer, Queue } from 'bullmq';
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
import { NOVEL_TRANSLATE_AND_INDEX_FLOW } from '@/infrastructure/bullmq/flows/novel-translate-and-index.flow';
import {
  NOVEL_INDEX_JOB,
  NOVEL_INDEX_QUEUE,
  NovelIndexJobPayload,
} from '@/infrastructure/bullmq/queues/novel-index.queue';
import { JobFlowFactory } from '@/modules/jobs/factories/job-flow.factory';
import { FilenameUtil } from '@/common/utils/filename.util';
import {
  NOVEL_BULK_IMPORT_QUEUE,
  NOVEL_BULK_IMPORT_JOB,
  NovelBulkImportJobPayload,
} from '@/infrastructure/bullmq/queues/novel_bulk_import.queue';
import { TemporaryStorageService } from '@/infrastructure/storage/services/temporary-storage.service';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job) private jobsRepository: Repository<Job>,
    @InjectQueue(NOVEL_IMPORT_QUEUE)
    private readonly novelImportQueue: Queue<NovelImportJobPayload>,
    @InjectQueue(NOVEL_TRANSLATION_QUEUE)
    private readonly novelTranslateQueue: Queue<NovelTranslationJobPayload>,
    @InjectQueue(NOVEL_INDEX_QUEUE)
    private readonly novelIndexQueue: Queue<NovelIndexJobPayload>,
    @InjectQueue(NOVEL_BULK_IMPORT_QUEUE)
    private readonly novelBulkImportQueue: Queue<NovelBulkImportJobPayload>,
    @InjectFlowProducer(NOVEL_TRANSLATE_AND_INDEX_FLOW)
    private readonly flowProducer: FlowProducer,
    private readonly dataSource: DataSource,
    private readonly novelService: NovelsService,
    private readonly flowFactory: JobFlowFactory,
    private readonly tempStorageService: TemporaryStorageService
  ) {}

  async enqueueNovelImport(file: Express.Multer.File, formatId?: string) {
    const dbImportJob = await this.jobsRepository.save({
      type: JobType.IMPORT_NOVEL,
      status: JobStatus.WAITING,
      entityType: JobEntity.NOVEL,
      payload: {
        formatId,
      },
      attempts: 0,
    });

    try {
      const normalizedFileName = FilenameUtil.normalize(file.originalname);
      const storageKey = await this.tempStorageService.saveArchive(
        dbImportJob.id,
        normalizedFileName,
        file.buffer
      );

      const bullmqJob = await this.novelImportQueue.add(NOVEL_IMPORT_JOB, {
        dbJobId: dbImportJob.id,
        fileName: normalizedFileName,
        formatId,
        storageKey,
      });

      await this.jobsRepository.update(
        { id: dbImportJob.id },
        {
          queueJobId: String(bullmqJob.id),
        }
      );

      return {
        status: JobStatus.WAITING,
        jobId: dbImportJob.id,
      };
    } catch (error) {
      await this.jobsRepository.update(
        { id: dbImportJob.id },
        {
          status: JobStatus.FAILED,
          failedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : String(error),
        }
      );

      throw error;
    }
  }

  async enqueueBulkNovelImport(file: Express.Multer.File) {
    const dbBulkImportJob = await this.jobsRepository.save({
      type: JobType.BULK_IMPORT_NOVEL,
      status: JobStatus.WAITING,
      entityType: JobEntity.NOVEL,
      payload: {},
      attempts: 0,
    });

    try {
      const normalizedFileName = FilenameUtil.normalize(file.originalname);
      await this.tempStorageService.saveArchive(
        dbBulkImportJob.id,
        normalizedFileName,
        file.buffer
      );

      const bullmqJob = await this.novelBulkImportQueue.add(
        NOVEL_BULK_IMPORT_JOB,
        {
          dbJobId: dbBulkImportJob.id,
          fileName: normalizedFileName,
        }
      );

      await this.jobsRepository.update(
        { id: dbBulkImportJob.id },
        {
          queueJobId: String(bullmqJob.id),
          payload: {
            fileName: normalizedFileName,
          } as Record<string, any>,
        }
      );

      return {
        status: JobStatus.WAITING,
        jobId: dbBulkImportJob.id,
      };
    } catch (error) {
      await this.jobsRepository.update(
        { id: dbBulkImportJob.id },
        {
          status: JobStatus.FAILED,
          failedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : String(error),
        }
      );

      throw error;
    }
  }

  async enqueueNovelIndex(novelId: string, lang: Lang) {
    const novel = await this.novelService.getNovelBySlugOrId(novelId);

    if (!novel) {
      throw new NotFoundException('Novel not found');
    }

    const dbIndexJob = await this.jobsRepository.save({
      type: JobType.INDEX_NOVEL,
      status: JobStatus.WAITING,
      entityType: JobEntity.NOVEL,
      entityId: novelId,
      payload: {
        novelId,
        lang,
      },
      attempts: 0,
    });

    try {
      const bullmqJob = await this.novelIndexQueue.add(NOVEL_INDEX_JOB, {
        dbJobId: dbIndexJob.id,
        novelId,
        lang: lang,
      });

      await this.jobsRepository.update(
        { id: dbIndexJob.id },
        {
          queueJobId: String(bullmqJob.id),
        }
      );

      return {
        status: JobStatus.WAITING,
        jobId: dbIndexJob.id,
      };
    } catch (error) {
      await this.jobsRepository.update(
        { id: dbIndexJob.id },
        {
          status: JobStatus.FAILED,
          failedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : String(error),
        }
      );

      throw error;
    }
  }

  async enqueueNovelProcessing(novelId: string, targetLang: Lang) {
    const novel = await this.novelService.getNovelBySlugOrId(novelId);

    if (!novel) {
      throw new NotFoundException('Novel not found');
    }

    const isEnglish = targetLang === Lang.ENGLISH;

    const isAlreadyTranslated = await this.novelService.hasTranslation(
      novel.id,
      targetLang
    );

    const needTranslation = !isAlreadyTranslated;
    const needIndexing = isEnglish;

    if (!needTranslation && !needIndexing) {
      return {
        status: 'NO_ACTION_REQUIRED',
      };
    }

    const { translateDbJob, indexDbJob } = await this.dataSource.transaction(
      async (manager) => {
        const translateJob = needTranslation
          ? await manager.save(
              Job,
              manager.create(Job, {
                type: JobType.TRANSLATE_NOVEL,
                status: JobStatus.WAITING,
                entityType: JobEntity.NOVEL,
                entityId: novel.id,
                payload: {
                  novelId,
                  targetLang,
                },
                attempts: 0,
              })
            )
          : null;

        const indexJob = needIndexing
          ? await manager.save(
              Job,
              manager.create(Job, {
                type: JobType.INDEX_NOVEL,
                status: JobStatus.WAITING,
                entityType: JobEntity.NOVEL,
                entityId: novel.id,
                payload: {
                  novelId,
                  targetLang,
                },
                attempts: 0,
              })
            )
          : null;

        return {
          translateDbJob: translateJob,
          indexDbJob: indexJob,
        };
      }
    );

    try {
      /**
       * FLOW:
       * translation -> indexing
       */
      if (translateDbJob && indexDbJob) {
        const flowConfig = this.flowFactory.createTranslationAndIndexingFlow(
          translateDbJob,
          indexDbJob,
          novelId,
          targetLang
        );

        const flow = await this.flowProducer.add(flowConfig);

        await this.jobsRepository.update(indexDbJob.id, {
          queueJobId: String(flow.job.id),
        });

        const child = flow.children?.[0];

        if (child) {
          await this.jobsRepository.update(translateDbJob.id, {
            queueJobId: String(child.job.id),
          });
        }
      } else if (translateDbJob) {
        const bullmqJob = await this.novelTranslateQueue.add(
          NOVEL_TRANSLATION_JOB,
          {
            dbJobId: translateDbJob.id,
            novelId,
            targetLang,
          }
        );

        await this.jobsRepository.update(translateDbJob.id, {
          queueJobId: String(bullmqJob.id),
        });
      } else if (indexDbJob) {
        const bullmqJob = await this.novelIndexQueue.add(NOVEL_INDEX_JOB, {
          dbJobId: indexDbJob.id,
          novelId,
          lang: targetLang,
        });

        await this.jobsRepository.update(indexDbJob.id, {
          queueJobId: String(bullmqJob.id),
        });
      }

      return {
        status: JobStatus.WAITING,
        translateJobId: translateDbJob?.id,
        indexJobId: indexDbJob?.id,
      };
    } catch (error) {
      const failedUpdate = {
        status: JobStatus.FAILED,
        failedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : String(error),
      };

      if (translateDbJob) {
        await this.jobsRepository.update(translateDbJob.id, failedUpdate);
      }

      if (indexDbJob) {
        await this.jobsRepository.update(indexDbJob.id, failedUpdate);
      }

      throw error;
    }
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

  async incrementBulkProcessed(jobId: string) {
    await this.jobsRepository.query(
      `
      UPDATE jobs
      SET result = jsonb_set(
        result,
        '{processedFiles}',
        to_jsonb(
          COALESCE((result->>'processedFiles')::int, 0) + 1
        )
      )
      WHERE id = $1
    `,
      [jobId]
    );
  }
  async incrementBulkFailed(jobId: string) {
    await this.jobsRepository.query(
      `
      UPDATE jobs
      SET result = jsonb_set(
        result,
        '{failedFiles}',
        to_jsonb(
          COALESCE((result->>'failedFiles')::int, 0) + 1
        )
      )
      WHERE id = $1
    `,
      [jobId]
    );
  }
  async checkBulkCompletion(jobId: string) {
    const bulkJob = await this.jobsRepository.findOneByOrFail({
      id: jobId,
    });

    const result = (bulkJob.result ?? {}) as {
      totalFiles?: number;
      processedFiles?: number;
      failedFiles?: number;
    };

    const total = result.totalFiles ?? 0;
    const processed = result.processedFiles ?? 0;
    const failed = result.failedFiles ?? 0;

    if (processed + failed >= total) {
      await this.markCompleted(jobId, 0);
    }
  }
}
