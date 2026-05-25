import { ParsedNovel } from '../../../modules/novels/interfaces/parsed-novel.interface';

export const NOVEL_IMPORT_QUEUE = 'novel-import';
export const NOVEL_IMPORT_JOB = 'process-novel-import';

export interface NovelImportJobPayload {
  dbJobId: string;
  source: string;
  parsedNovel: ParsedNovel;
}
