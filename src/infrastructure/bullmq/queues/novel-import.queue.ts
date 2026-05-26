import { ParsedNovel } from '../../../modules/novels/interfaces/parsed-novel.interface';

export const NOVEL_IMPORT_QUEUE = 'novel-import';
export const NOVEL_IMPORT_JOB = 'process-novel-import';

export interface NovelImportJobPayload {
  dbJobId: string;
  /**
   * Parsing format identifier (schema/structure), not content origin.
   */
  formatId: string;
  /**
   * @deprecated Use `formatId` instead. Kept for backward compatibility.
   */
  source?: string;
  parsedNovel: ParsedNovel;
}
