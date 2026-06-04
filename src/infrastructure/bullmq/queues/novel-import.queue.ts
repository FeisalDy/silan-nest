export const NOVEL_IMPORT_QUEUE = 'novel-import';
export const NOVEL_IMPORT_JOB = 'process-novel-import';

export interface NovelImportJobPayload {
  dbJobId: string;
  bulkJobId?: string;
  storageKey: string;
  fileName: string;
  /**
   * Parsing format identifier (schema/structure), not content origin.
   */
  formatId?: string;
}
