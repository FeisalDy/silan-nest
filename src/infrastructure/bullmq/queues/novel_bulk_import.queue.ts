export const NOVEL_BULK_IMPORT_QUEUE = 'novel-bulk-import';
export const NOVEL_BULK_IMPORT_JOB = 'process-bulk-import';

export interface NovelBulkImportJobPayload {
    dbJobId: string;
    fileName: string;
}
