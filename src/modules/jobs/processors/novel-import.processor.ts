import {
  NOVEL_IMPORT_QUEUE,
  NovelImportJobPayload,
} from '@/infrastructure/bullmq/queues/novel-import.queue';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { NovelImportService } from '@/modules/jobs/services/novel-import.service';
import { Job } from 'bullmq';
import { JobsService } from '@/modules/jobs/jobs.service';
import { JobEntity } from '@/common/constants/job.constant';

@Processor(NOVEL_IMPORT_QUEUE)
export class NovelImportProcessor extends WorkerHost {
  constructor(
    private readonly jobsService: JobsService,
    private readonly novelImportService: NovelImportService
  ) {
    super();
  }

  async process(job: Job<NovelImportJobPayload>) {
    const result = await this.novelImportService.execute(job.data.parsedNovel);
    await this.jobsService.attachEntity(
      job.data.dbJobId,
      JobEntity.NOVEL,
      result.id
    );

    return result;
  }

  @OnWorkerEvent('active')
  async onActive(job: Job<NovelImportJobPayload>) {
    await this.jobsService.markRunning(job.data.dbJobId, job.attemptsMade);
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<NovelImportJobPayload>) {
    await this.jobsService.markCompleted(job.data.dbJobId, job.attemptsMade);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<NovelImportJobPayload>, error: Error) {
    if (!job?.data?.dbJobId) return;

    await this.jobsService.markFailed(
      job.data.dbJobId,
      error,
      job.attemptsMade
    );
  }
}
