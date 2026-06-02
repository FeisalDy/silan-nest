export class StorageKeys {
  static importArchive(jobId: string, filename: string) {
    return `imports/${jobId}/archive/${filename}`;
  }

  static extractedFile(jobId: string, filename: string) {
    return `imports/${jobId}/extracted/${filename}`;
  }

  static failedFile(jobId: string, filename: string) {
    return `imports/${jobId}/failed/${filename}`;
  }

  static report(jobId: string, filename: string) {
    return `imports/${jobId}/reports/${filename}`;
  }
}
