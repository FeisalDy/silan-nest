export const NOVEL_TRANSLATION_QUEUE = 'novel-translation';
export const NOVEL_TRANSLATION_JOB = 'process-novel-translation';

export interface NovelTranslationJobPayload {
  novelId: string;
  targetLang: string;
}
