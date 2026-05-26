import { NovelTranslationJobPayload } from '@/infrastructure/bullmq/queues/novel-translation.queue';
import { NovelIndexJobPayload } from '@/infrastructure/bullmq/queues/novel-index.queue';

export const NOVEL_TRANSLATE_AND_INDEX_FLOW = 'novel-translate-and-index';

export type TranslateFlowChild = NovelTranslationJobPayload;

export type IndexFlowParent = NovelIndexJobPayload;
