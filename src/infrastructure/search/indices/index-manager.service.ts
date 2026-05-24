import {
  Injectable, Logger, OnModuleInit,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from '@nestjs/elasticsearch';

import { CHAPTER_TRANSLATION_INDEX, chapterIndexSettings } from '@/infrastructure/search/indices/chapters.index';
import { isTruthyEnv } from '@/common/utils/is-truthy-env.util';

@Injectable()
export class IndexManagerService implements OnModuleInit {
  private readonly logger = new Logger(IndexManagerService.name);

  constructor(private readonly elastic: ElasticsearchService, private readonly config: ConfigService) {
  }

  async onModuleInit() {
    const enabled =
      isTruthyEnv(this.config.get<string>('ELASTICSEARCH_ENABLED'));
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';

    if (!enabled) {
      this.logger.log('Elasticsearch is disabled.');
      return;
    }

    if (isProduction) {
      this.logger.log('Skipping automatic index creation in Production environment.');
      return;
    }

    await this.ensureIndex(CHAPTER_TRANSLATION_INDEX, chapterIndexSettings);
  }

  private async ensureIndex(index: string, config: any) {
    try {
      const exists = await this.elastic.indices.exists({ index });

      if (exists) {
        this.logger.log(`Index already exists: ${index}`);
        return;
      }

      // Ensure the config object actually contains the 'index' name
      await this.elastic.indices.create({
        index, ...config,
      });

      this.logger.log(`Created index: ${index}`);
    } catch (error) {
      this.logger.error(`Failed to ensure index ${index}: ${error.message}`);
    }
  }
}