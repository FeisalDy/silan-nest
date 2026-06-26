import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Job } from "../entities/job.entity";
import { Repository } from "typeorm";
import { CONCURRENCY, DEFAULT_BULK_LIMIT, JobStatus, MAX_MANUAL_RETRIES } from "@/common/constants/job.constant";
import { JobQueueRegistry } from "@/infrastructure/bullmq/queues/job-queue.registry";
import { RetryFilterDto } from "../dto/retry-filter.request.dto";
import pLimit from "p-limit";

@Injectable()
export class JobsRetryService {
    constructor(@InjectRepository(Job) private jobsRepository: Repository<Job>, private readonly queueRegistry: JobQueueRegistry) { }

    async retry(jobId: string) {
        const job = await this.jobsRepository.findOneBy({ id: jobId });
        if (!job) throw new NotFoundException('Job not found');

        if (job.status !== JobStatus.FAILED) {
            throw new BadRequestException(
                `Only ${JobStatus.FAILED} jobs can be retried (current status: ${job.status})`
            );
        }

        if (job.manualRetryCount >= MAX_MANUAL_RETRIES) {
            throw new BadRequestException('Max manual retries exceeded');
        }

        const queue = this.queueRegistry.resolve(job.type);

        // Rebuild payload — original payload + dbJobId reference is preserved
        const payload = { ...job.payload, dbJobId: job.id };

        const bullJob = await queue.add(job.type, payload, {
            // new id avoids collisions with the old failed BullMQ job
            jobId: `${job.id}:retry:${job.manualRetryCount + 1}`,
        });

        await this.jobsRepository.update(job.id, {
            status: JobStatus.WAITING,
            queueJobId: bullJob.id,
            manualRetryCount: job.manualRetryCount + 1,
            errorMessage: null,
            errorStack: null,
            startedAt: null,
            completedAt: null,
        });

        return this.jobsRepository.findOneBy({ id: job.id });
    }

    async previewRetry(filter: RetryFilterDto) {
        const qb = this.buildFailedJobsQuery(filter).take(filter.limit ?? 100);
        const [jobs, count] = await Promise.all([
            qb.getMany(),
            this.buildFailedJobsQuery(filter).getCount(),
        ]);
        return { count, jobs };
    }

    async retryMany(filter: RetryFilterDto) {
        const limit = Math.min(filter.limit ?? DEFAULT_BULK_LIMIT, DEFAULT_BULK_LIMIT);

        const qb = this.buildFailedJobsQuery(filter).take(limit);
        const totalMatched = await this.buildFailedJobsQuery(filter).getCount();
        const jobs = await qb.getMany();

        const limiter = pLimit(CONCURRENCY);

        const results = await Promise.all(
            jobs.map((job) =>
                limiter(async () => {
                    try {
                        await this.retry(job.id);
                        return { jobId: job.id, success: true };
                    } catch (err) {
                        return {
                            jobId: job.id,
                            success: false,
                            error: err instanceof Error ? err.message : 'Unknown error',
                        };
                    }
                })
            )
        );

        return {
            totalMatched,
            attempted: results.length,
            succeeded: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
            results,
        };
    }

    private buildFailedJobsQuery(filter: RetryFilterDto) {
        const qb = this.jobsRepository.createQueryBuilder('job')
            .where('job.status = :status', { status: JobStatus.FAILED });

        if (filter.ids?.length) {
            qb.andWhere('job.id IN (:...ids)', { ids: filter.ids });
            return qb; // ids = explicit selection, ignore the rest
        }

        if (filter.types?.length) {
            qb.andWhere('job.type IN (:...types)', { types: filter.types });
        }

        if (filter.entityTypes?.length) {
            qb.andWhere('job.entityType IN (:...entityTypes)', {
                entityTypes: filter.entityTypes,
            });
        }

        if (filter.bulkJobId) {
            qb.andWhere('job.bulkJobId = :bulkJobId', { bulkJobId: filter.bulkJobId });
        }

        if (filter.failedAfter) {
            qb.andWhere('job.failedAt >= :failedAfter', { failedAfter: filter.failedAfter });
        }

        if (filter.failedBefore) {
            qb.andWhere('job.failedAt <= :failedBefore', { failedBefore: filter.failedBefore });
        }

        return qb;
    }
}