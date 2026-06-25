import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { estypes } from '@elastic/elasticsearch';

import { chapterIndexSettings } from '@/infrastructure/search/adapters/es_indices/chapters.index';
import { isTruthyEnv } from '@/common/utils/is-truthy-env.util';

@Injectable()
export class IndexManagerService implements OnModuleInit {
    private readonly logger = new Logger(IndexManagerService.name);

    constructor(
        private readonly elastic: ElasticsearchService,
        private readonly config: ConfigService
    ) {}

    async onModuleInit() {
        const enabled = isTruthyEnv(
            this.config.get<string>('ELASTICSEARCH_ENABLED')
        );
        const isProduction =
            this.config.get<string>('NODE_ENV') === 'production';

        if (!enabled) {
            this.logger.log('Elasticsearch is disabled.');
            return;
        }

        if (isProduction) {
            this.logger.log(
                'Skipping automatic index creation in Production environment.'
            );
            return;
        }

        await this.ensureIndex(chapterIndexSettings);
    }

    private async ensureIndex(config: estypes.IndicesCreateRequest) {
        const index = config.index;
        try {
            const exists = await this.elastic.indices.exists({ index });

            if (!exists) {
                await this.elastic.indices.create(config);
                this.logger.log(`Created fresh index: ${index}`);
                return;
            }

            if (config.mappings) {
                await this.elastic.indices.putMapping({
                    index,
                    ...config.mappings,
                });
                this.logger.log(`Updated mappings for index: ${index}`);
            }
        } catch (error: any) {
            this.logger.warn(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                `Failed to update mappings in place: ${error.message}. Recreating index...`
            );

            try {
                await this.elastic.indices.delete({ index });
                await this.elastic.indices.create(config);
                this.logger.log(
                    `Recreated index ${index} due to breaking schema changes.`
                );
            } catch (recreateError: any) {
                this.logger.error(
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    `Critical failure recreating index ${index}: ${recreateError.message}`
                );
            }
        }
    }
}
