export const NOVEL_INDEX_QUEUE = 'novel-index';
export const NOVEL_INDEX_JOB = 'process-novel-index';

export interface NovelIndexJobPayload {
  novelId: string;
}

