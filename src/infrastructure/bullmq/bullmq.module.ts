import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { NOVEL_IMPORT_QUEUE } from './queues/novel-import.queue';
import { NOVEL_TRANSLATION_QUEUE } from './queues/novel-translation.queue';
import { NOVEL_INDEX_QUEUE } from './queues/novel-index.queue';

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
  ],
  providers: [],
  exports: [BullModule],
})
export class BullmqInfrastructureModule {}
