import { Injectable } from '@nestjs/common';
import { Job } from '@/modules/jobs/entities/job.entity';
import { Lang } from '@/common/constants/lang.constant';
import {
  NOVEL_INDEX_JOB,
  NOVEL_INDEX_QUEUE,
} from '@/infrastructure/bullmq/queues/novel-index.queue';
import {
  IndexFlowParent,
  TranslateFlowChild,
} from '@/infrastructure/bullmq/flows/novel-translate-and-index.flow';
import {
  NOVEL_TRANSLATION_JOB,
  NOVEL_TRANSLATION_QUEUE,
} from '@/infrastructure/bullmq/queues/novel-translation.queue';

@Injectable()
export class JobFlowFactory {
  createTranslationAndIndexingFlow(
    translateJob: Job,
    indexJob: Job,
    novelId: string,
    targetLang: Lang
  ) {
    return {
      name: NOVEL_INDEX_JOB,
      queueName: NOVEL_INDEX_QUEUE,
      data: { dbJobId: indexJob.id, novelId } satisfies IndexFlowParent,
      children: [
        {
          name: NOVEL_TRANSLATION_JOB,
          queueName: NOVEL_TRANSLATION_QUEUE,
          data: {
            dbJobId: translateJob.id,
            novelId,
            targetLang,
          } satisfies TranslateFlowChild,
        },
      ],
    };
  }
}
