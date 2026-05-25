export enum JobType {
  IMPORT_NOVEL = 'import_novel',
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
