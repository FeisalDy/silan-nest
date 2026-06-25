import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JobType } from '@/common/constants/job.constant';
import { NOVEL_IMPORT_QUEUE } from '@/infrastructure/bullmq/queues/novel-import.queue';
import { NOVEL_BULK_IMPORT_QUEUE } from '@/infrastructure/bullmq/queues/novel_bulk_import.queue';

@Injectable()
export class JobQueueRegistry {
    private readonly registry: Map<JobType, Queue>;

    constructor(
        @InjectQueue(NOVEL_IMPORT_QUEUE) novelImportQueue: Queue,
        @InjectQueue(NOVEL_BULK_IMPORT_QUEUE) novelBulkImportQueue: Queue
        // inject + register every other queue here
    ) {
        this.registry = new Map<JobType, Queue>([
            [JobType.IMPORT_NOVEL, novelImportQueue],
            [JobType.BULK_IMPORT_NOVEL, novelBulkImportQueue],
        ]);
    }

    resolve(type: JobType): Queue {
        const queue = this.registry.get(type);
        if (!queue) {
            throw new Error(`No queue registered for job type: ${type}`);
        }
        return queue;
    }
}