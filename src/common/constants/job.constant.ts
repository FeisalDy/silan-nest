export enum JobType {
    IMPORT_NOVEL = 'import_novel',
    BULK_IMPORT_NOVEL = 'bulk_import_novel',
    TRANSLATE_NOVEL = 'translating_novel',
    INDEX_NOVEL = 'index_novel',
}
export enum JobStatus {
    WAITING = 'waiting',
    RUNNING = 'running',
    COMPLETED = 'completed',
    FAILED = 'failed',
}
export enum JobEntity {
    NOVEL = 'novel',
}
export const MAX_MANUAL_RETRIES = 3;
export const DEFAULT_BULK_LIMIT = 500; // hard safety cap unless explicitly raised
export const CONCURRENCY = 10;