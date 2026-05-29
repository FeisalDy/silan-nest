import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectFlowProducer, InjectQueue } from '@nestjs/bullmq';
import {
  NOVEL_IMPORT_JOB,
  NOVEL_IMPORT_QUEUE,
  NovelImportJobPayload,
} from '@/infrastructure/bullmq/queues/novel-import.queue';
import { FlowProducer, Queue } from 'bullmq';
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
import { NOVEL_TRANSLATE_AND_INDEX_FLOW } from '@/infrastructure/bullmq/flows/novel-translate-and-index.flow';
import {
  NOVEL_INDEX_JOB,
  NOVEL_INDEX_QUEUE,
  NovelIndexJobPayload,
} from '@/infrastructure/bullmq/queues/novel-index.queue';
import { JobFlowFactory } from '@/modules/jobs/factories/job-flow.factory';
import { TextDecoderUtil } from '@/common/utils/text-decoder.util';

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
    @InjectFlowProducer(NOVEL_TRANSLATE_AND_INDEX_FLOW)
    private readonly flowProducer: FlowProducer,
    private readonly parserRegistry: NovelParserRegistry,
    private readonly dataSource: DataSource,
    private readonly novelService: NovelsService,
    private readonly flowFactory: JobFlowFactory
  ) {}

  previewNovelImport(
    file: Express.Multer.File,
    formatId?: string,
    chapterLimit?: number
  ) {
    const { parsedNovel, formatId: resolvedFormatId } = this.parseNovel(
      file,
      formatId,
      chapterLimit
    );

    if (!parsedNovel.title) {
      const cleanFileName = Buffer.from(file.originalname, 'latin1').toString(
        'utf8'
      );
      parsedNovel.title = NovelTitleGenerator.generate({
        fileName: cleanFileName,
        firstChapterTitle: parsedNovel.chapters[0]?.title,
        languageCode: parsedNovel.languageCode,
      });
    }

    return { parsedNovel, resolvedFormatId };
  }

  async enqueueNovelImport(file: Express.Multer.File, formatId?: string) {
    const { parsedNovel, resolvedFormatId } = this.previewNovelImport(
      file,
      formatId
    );

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
          formatId: resolvedFormatId,
          source: resolvedFormatId,
          parsedNovel: payloadNovel,
        },
        attempts: 0,
      });

      const savedDbJob = await manager.save(Job, dbJob);

      const bullmqJob = await this.novelImportQueue.add(NOVEL_IMPORT_JOB, {
        dbJobId: savedDbJob.id,
        formatId: resolvedFormatId,
        source: resolvedFormatId,
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

  async enqueueNovelProcessing(novelId: string, targetLang: Lang) {
    const novel = await this.novelService.findNovelBySlugOrId(novelId);

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
        queueJobId: flow.job.id,
      });

      const child = flow.children?.[0];

      if (child) {
        await this.jobsRepository.update(translateDbJob.id, {
          queueJobId: child.job.id,
        });
      }
    } else if (translateDbJob) {
      /**
       * Translation only
       */
      const bullmqJob = await this.novelTranslateQueue.add(
        NOVEL_TRANSLATION_JOB,
        {
          dbJobId: translateDbJob.id,
          novelId,
          targetLang,
        }
      );

      await this.jobsRepository.update(translateDbJob.id, {
        queueJobId: bullmqJob.id,
      });
    } else if (indexDbJob) {
      const bullmqJob = await this.novelIndexQueue.add(NOVEL_INDEX_JOB, {
        dbJobId: indexDbJob.id,
        novelId,
      });

      await this.jobsRepository.update(indexDbJob.id, {
        queueJobId: bullmqJob.id,
      });
    }

    return {
      status: JobStatus.WAITING,
      translateJobId: translateDbJob?.id,
      indexJobId: indexDbJob?.id,
    };
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

  private parseNovel(
    file: Express.Multer.File,
    formatId?: string,
    chapterLimit?: number
  ) {
    // Limit the filesize to 64kb for format detection, so instead of O(file-size),
    // its O(256kb) which is much faster for large files and still enough for format detection
    const sample = TextDecoderUtil.decode(file.buffer.subarray(0, 64_000));

    const parser = formatId
      ? this.parserRegistry.getByFormatId(formatId)
      : this.parserRegistry.detect(sample);

    const fullText = TextDecoderUtil.decode(file.buffer);

    return {
      formatId: parser.formatId,
      parsedNovel: parser.parse(fullText, chapterLimit),
    };
  }
}
