import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NovelsService } from '../novels.service';
import { NOVEL_INDEX_JOB, NOVEL_INDEX_QUEUE, NovelIndexJobPayload } from './novel-index.queue';

@Processor(NOVEL_INDEX_QUEUE)
export class NovelIndexProcessor extends WorkerHost {
  private readonly logger = new Logger(NovelIndexProcessor.name);

  constructor(private readonly novelsService: NovelsService) {
    super();
  }

  async process(job: Job<NovelIndexJobPayload>): Promise<void> {
    if (job.name !== NOVEL_INDEX_JOB) return;

    const { novelId } = job.data;

    this.logger.log(`Processing index job #${job.id} for novel: ${novelId}`);

    try {
      await this.novelsService.indexNovelChapters(novelId);
      this.logger.log(`Indexing complete for novel: ${novelId}`);
    } catch (error) {
      this.logger.error(`Failed to index novel: ${novelId}`, error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
}


