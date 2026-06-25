import { Injectable, NotFoundException } from '@nestjs/common';

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

    async saveExtractedFile(jobId: string, filename: string, buffer: Buffer) {
        const key = StorageKeys.extractedFile(jobId, filename);

        await this.storage.upload(key, buffer);

        return key;
    }

    async saveFailedFile(jobId: string, filename: string, buffer: Buffer) {
        const key = StorageKeys.failedFile(jobId, filename);

        await this.storage.upload(key, buffer);

        return key;
    }

    async getArchive(jobId: string, filename: string) {
        const key = StorageKeys.importArchive(jobId, filename);

        const isExist = await this.storage.exists(key);
        if (!isExist) {
            throw new NotFoundException(`File '${filename}' was not found`);
        }

        return this.storage.download(key);
    }
}
