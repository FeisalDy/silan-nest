import { Injectable } from '@nestjs/common';

import { StorageService } from '../storage.service';
import { StorageKeys } from '../helpers/storage-key.helper';

@Injectable()
export class TemporaryStorageService {
  constructor(private readonly storage: StorageService) {}

  async saveArchive(jobId: string, filename: string, buffer: Buffer) {
    const key = StorageKeys.importArchive(jobId, filename);

    await this.storage.upload(key, buffer);

    return key;
  }

  async saveFailedFile(jobId: string, filename: string, buffer: Buffer) {
    const key = StorageKeys.failedFile(jobId, filename);

    await this.storage.upload(key, buffer);

    return key;
  }
}
