// jobs-retry.service.spec.ts
jest.mock('p-limit', () => ({
    __esModule: true,
    default: () => (fn: () => Promise<unknown>) => fn(),
}));
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JobsRetryService } from '../services/jobs-retry.service';
import { JobQueueRegistry } from '@/infrastructure/bullmq/queues/job-queue.registry';
import { Job } from '../entities/job.entity';
import { JobStatus, JobType } from '@/common/constants/job.constant';

describe('JobsRetryService', () => {
    let service: JobsRetryService;
    let repo: { findOneBy: jest.Mock; update: jest.Mock; createQueryBuilder: jest.Mock };
    let queueRegistry: { resolve: jest.Mock };
    let mockQueue: { add: jest.Mock };

    const baseJob = (overrides: Partial<Job> = {}): Job =>
    ({
        id: 'job-1',
        type: JobType.IMPORT_NOVEL,
        status: JobStatus.FAILED,
        manualRetryCount: 0,
        payload: { sourceUrl: 'x' },
        ...overrides,
    } as Job);

    beforeEach(async () => {
        mockQueue = { add: jest.fn().mockResolvedValue({ id: 'bull-123' }) };
        queueRegistry = { resolve: jest.fn().mockReturnValue(mockQueue) };
        repo = {
            findOneBy: jest.fn(),
            update: jest.fn().mockResolvedValue(undefined),
            createQueryBuilder: jest.fn(),
        };

        const moduleRef = await Test.createTestingModule({
            providers: [
                JobsRetryService,
                { provide: getRepositoryToken(Job), useValue: repo },
                { provide: JobQueueRegistry, useValue: queueRegistry },
            ],
        }).compile();

        service = moduleRef.get(JobsRetryService);
    });

    describe('retry()', () => {
        it('throws NotFoundException if job does not exist', async () => {
            repo.findOneBy.mockResolvedValueOnce(undefined);
            await expect(service.retry('missing-id')).rejects.toThrow(NotFoundException);
        });

        it('throws BadRequestException if job is not FAILED', async () => {
            repo.findOneBy.mockResolvedValueOnce(baseJob({ status: JobStatus.COMPLETED }));
            await expect(service.retry('job-1')).rejects.toThrow(BadRequestException);
            expect(mockQueue.add).not.toHaveBeenCalled();
        });

        it('throws BadRequestException if manualRetryCount exceeds max', async () => {
            repo.findOneBy.mockResolvedValueOnce(baseJob({ manualRetryCount: 3 }));
            await expect(service.retry('job-1')).rejects.toThrow(/Max manual retries/);
        });

        it('resolves the correct queue by job.type', async () => {
            repo.findOneBy
                .mockResolvedValueOnce(baseJob())
                .mockResolvedValueOnce(baseJob({ status: JobStatus.WAITING }));

            await service.retry('job-1');

            expect(queueRegistry.resolve).toHaveBeenCalledWith(JobType.IMPORT_NOVEL);
        });

        it('enqueues with a new jobId derived from retry count (avoids BullMQ id collision)', async () => {
            repo.findOneBy
                .mockResolvedValueOnce(baseJob({ manualRetryCount: 1 }))
                .mockResolvedValueOnce(baseJob());

            await service.retry('job-1');

            expect(mockQueue.add).toHaveBeenCalledWith(
                JobType.IMPORT_NOVEL,
                expect.objectContaining({ dbJobId: 'job-1' }),
                expect.objectContaining({ jobId: 'job-1:retry:2' })
            );
        });

        it('resets status/error fields and increments manualRetryCount', async () => {
            repo.findOneBy
                .mockResolvedValueOnce(baseJob({ manualRetryCount: 0, errorMessage: 'boom' }))
                .mockResolvedValueOnce(baseJob());

            await service.retry('job-1');

            expect(repo.update).toHaveBeenCalledWith(
                'job-1',
                expect.objectContaining({
                    status: JobStatus.WAITING,
                    manualRetryCount: 1,
                    errorMessage: null,
                    failedAt: null,
                })
            );
        });
    });

    describe('retryMany()', () => {
        // Easiest pattern: stub buildFailedJobsQuery to avoid re-mocking QueryBuilder chains
        it('isolates failures — one bad job does not abort the batch', async () => {
            const jobs = [baseJob({ id: 'a' }), baseJob({ id: 'b' }), baseJob({ id: 'c' })];

            jest.spyOn<any, any>(service, 'buildFailedJobsQuery').mockReturnValue({
                take: () => ({ getMany: () => Promise.resolve(jobs) }),
                getCount: () => Promise.resolve(3),
            });

            // job 'b' fails inside retry()
            jest.spyOn(service, 'retry').mockImplementation(async (id) => {
                if (id === 'b') throw new Error('queue down');
                return baseJob({ id });
            });

            const result = await service.retryMany({});

            expect(result.totalMatched).toBe(3);
            expect(result.succeeded).toBe(2);
            expect(result.failed).toBe(1);
            expect(result.results.find((r) => r.jobId === 'b')).toMatchObject({
                success: false,
                error: 'queue down',
            });
        });

        it('caps attempted count at the configured limit even if more jobs match', async () => {
            jest.spyOn<any, any>(service, 'buildFailedJobsQuery').mockReturnValue({
                take: () => ({ getMany: () => Promise.resolve([baseJob({ id: 'a' })]) }),
                getCount: () => Promise.resolve(800), // more matched than fetched
            });
            jest.spyOn(service, 'retry').mockResolvedValue(baseJob());

            const result = await service.retryMany({ limit: 1 });

            expect(result.totalMatched).toBe(800);
            expect(result.attempted).toBe(1);
        });
    });
});