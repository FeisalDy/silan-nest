import { Module } from '@nestjs/common';
import { STORAGE_ADAPTER } from './storage.tokens';
import { StorageService } from './storage.service';
import { TemporaryStorageService } from './services/temporary-storage.service';
import { LocalStorageAdapter } from './adapters/local-storage.adapter';

@Module({
    providers: [
        {
            provide: STORAGE_ADAPTER,
            useClass: LocalStorageAdapter,
        },

        StorageService,
        TemporaryStorageService,
    ],
    exports: [StorageService, TemporaryStorageService],
})
export class StorageModule {}
