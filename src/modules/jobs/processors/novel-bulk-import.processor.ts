import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import {
    NOVEL_BULK_IMPORT_QUEUE,
    NovelBulkImportJobPayload,
} from '@/infrastructure/bullmq/queues/novel_bulk_import.queue';
import { Job } from 'bullmq';
import { NovelBulkImportService } from '@/modules/jobs/services/novel-bulk-import.service';
import { JobsService } from '@/modules/jobs/jobs.service';

@Processor(NOVEL_BULK_IMPORT_QUEUE)
export class NovelBulkImportProcessor extends WorkerHost {
    constructor(
        private readonly jobsService: JobsService,
        private readonly novelBulkImportService: NovelBulkImportService
    ) {
        super();
    }

    async process(job: Job<NovelBulkImportJobPayload>) {
        await this.novelBulkImportService.execute(job.data);
    }

    @OnWorkerEvent('active')
    async onActive(job: Job<NovelBulkImportJobPayload>) {
        await this.jobsService.markRunning(job.data.dbJobId, job.attemptsMade);
    }

    @OnWorkerEvent('completed')
    async onCompleted(job: Job<NovelBulkImportJobPayload>) {
        await this.jobsService.markCompleted(
            job.data.dbJobId,
            job.attemptsMade
        );
    }

    @OnWorkerEvent('failed')
    async onFailed(job: Job<NovelBulkImportJobPayload>, error: Error) {
        if (!job?.data?.dbJobId) return;

        await this.jobsService.markFailed(
            job.data.dbJobId,
            error,
            job.attemptsMade
        );
    }
}
