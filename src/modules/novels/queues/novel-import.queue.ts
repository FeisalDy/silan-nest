import { ParsedNovel } from '../interfaces/parsed-novel.interface';

export const NOVEL_IMPORT_QUEUE = 'novel-import';
export const NOVEL_IMPORT_JOB = 'process-novel-import';

export interface NovelImportJobPayload {
  source: string;
  parsedNovel: ParsedNovel;
}
