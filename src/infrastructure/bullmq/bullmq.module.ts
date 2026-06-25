import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { NOVEL_IMPORT_QUEUE } from './queues/novel-import.queue';
import { NOVEL_TRANSLATION_QUEUE } from './queues/novel-translation.queue';
import { NOVEL_INDEX_QUEUE } from './queues/novel-index.queue';
import { NOVEL_TRANSLATE_AND_INDEX_FLOW } from '@/infrastructure/bullmq/flows/novel-translate-and-index.flow';
import { NOVEL_BULK_IMPORT_QUEUE } from '@/infrastructure/bullmq/queues/novel_bulk_import.queue';
import { JobQueueRegistry } from './queues/job-queue.registry';

@Global()
@Module({
    imports: [
        BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                connection: {
                    host: config.get<string>('REDIS_HOST', 'localhost'),
                    port: config.get<number>('REDIS_PORT', 6379),
                    password: config.get<string>('REDIS_PASSWORD'),
                },
            }),
        }),
        BullModule.registerQueue(
            { name: NOVEL_IMPORT_QUEUE },
            { name: NOVEL_TRANSLATION_QUEUE },
            { name: NOVEL_INDEX_QUEUE },
            { name: NOVEL_BULK_IMPORT_QUEUE }
        ),
        BullModule.registerFlowProducer({
            name: NOVEL_TRANSLATE_AND_INDEX_FLOW,
        }),
    ],
    providers: [JobQueueRegistry],
    exports: [BullModule, JobQueueRegistry],
})
export class BullmqInfrastructureModule { }
