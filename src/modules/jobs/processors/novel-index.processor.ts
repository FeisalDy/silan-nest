import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import {
  NOVEL_INDEX_QUEUE,
  NovelIndexJobPayload,
} from '@/infrastructure/bullmq/queues/novel-index.queue';
import { JobsService } from '@/modules/jobs/jobs.service';
import { Job } from 'bullmq';
import { NovelIndexService } from '@/modules/jobs/services/novel-index.service';

@Processor(NOVEL_INDEX_QUEUE)
export class NovelIndexProcessor extends WorkerHost {
  constructor(
    private readonly jobsService: JobsService,
    private readonly novelIndexService: NovelIndexService
  ) {
    super();
  }

  async process(job: Job<NovelIndexJobPayload>) {
    await this.novelIndexService.execute(job.data.novelId);
  }

  @OnWorkerEvent('active')
  async onActive(job: Job<NovelIndexJobPayload>) {
    await this.jobsService.markRunning(job.data.dbJobId, job.attemptsMade);
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<NovelIndexJobPayload>) {
    await this.jobsService.markCompleted(job.data.dbJobId, job.attemptsMade);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<NovelIndexJobPayload>, error: Error) {
    if (!job?.data?.dbJobId) return;

    await this.jobsService.markFailed(
      job.data.dbJobId,
      error,
      job.attemptsMade
    );
  }
}
