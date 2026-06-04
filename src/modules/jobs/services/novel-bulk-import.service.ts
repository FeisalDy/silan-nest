import { Injectable } from '@nestjs/common';
import AdmZip from 'adm-zip';
import { TemporaryStorageService } from '@/infrastructure/storage/services/temporary-storage.service';
import { NovelBulkImportJobPayload } from '@/infrastructure/bullmq/queues/novel_bulk_import.queue';
import { InjectQueue } from '@nestjs/bullmq';
import {
  NOVEL_IMPORT_QUEUE,
  NovelImportJobPayload,
} from '@/infrastructure/bullmq/queues/novel-import.queue';
import { Queue } from 'bullmq';
import {
  NOVEL_INDEX_QUEUE,
  NovelIndexJobPayload,
} from '@/infrastructure/bullmq/queues/novel-index.queue';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from '@/modules/jobs/entities/job.entity';
import { Repository } from 'typeorm';
import { JobEntity, JobStatus, JobType } from '@/common/constants/job.constant';

@Injectable()
export class NovelBulkImportService {
  constructor(
    @InjectRepository(Job) private jobsRepository: Repository<Job>,
    private readonly tempStorageService: TemporaryStorageService,
    @InjectQueue(NOVEL_IMPORT_QUEUE)
    private readonly novelImportQueue: Queue<NovelImportJobPayload>,
    @InjectQueue(NOVEL_INDEX_QUEUE)
    private readonly novelIndexQueue: Queue<NovelIndexJobPayload>
  ) {}

  async execute(payload: NovelBulkImportJobPayload) {
    const file = await this.tempStorageService.getArchive(
      payload.dbJobId,
      payload.fileName
    );

    const zip = new AdmZip(file);
    const entries = zip.getEntries();
    const jobs: {
      name: string;
      data: NovelImportJobPayload;
    }[] = [];

    for (const entry of entries) {
      if (entry.isDirectory) {
        continue;
      }

      const fileBuffer = entry.getData();

      await this.tempStorageService.saveExtractedFile(
        payload.dbJobId,
        entry.entryName,
        fileBuffer
      );

      const dbJob = await this.jobsRepository.save({
        type: JobType.IMPORT_NOVEL,
        status: JobStatus.WAITING,
        entityType: JobEntity.NOVEL,
        payload: {
          fileName: entry.entryName,
          bulkJobId: payload.dbJobId,
        },
      });
    }
  }
}
