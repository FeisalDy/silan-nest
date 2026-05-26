import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { NOVEL_IMPORT_QUEUE } from './queues/novel-import.queue';
import { NOVEL_TRANSLATION_QUEUE } from './queues/novel-translation.queue';
import { NOVEL_INDEX_QUEUE } from './queues/novel-index.queue';
import { NOVEL_TRANSLATE_AND_INDEX_FLOW } from '@/infrastructure/bullmq/flows/novel-translate-and-index.flow';

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
      { name: NOVEL_INDEX_QUEUE }
    ),
    BullModule.registerFlowProducer({
      name: NOVEL_TRANSLATE_AND_INDEX_FLOW,
    }),
  ],
  providers: [],
  exports: [BullModule],
})
export class BullmqInfrastructureModule {}
