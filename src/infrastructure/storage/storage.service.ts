import { Inject, Injectable } from '@nestjs/common';
import { STORAGE_ADAPTER } from '@/infrastructure/storage/storage.tokens';
import { type StorageAdapter } from '@/infrastructure/storage/interfaces/storage-adapter.interface';

@Injectable()
export class StorageService {
    constructor(
        @Inject(STORAGE_ADAPTER)
        private readonly storage: StorageAdapter
    ) {}

    upload(key: string, buffer: Buffer) {
        return this.storage.upload(key, buffer);
    }

    download(key: string) {
        return this.storage.download(key);
    }

    delete(key: string) {
        return this.storage.delete(key);
    }

    exists(key: string) {
        return this.storage.exists(key);
    }
}
