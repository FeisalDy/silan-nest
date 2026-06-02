import { DynamicModule, Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

import { SearchService } from './search.service';
import { ElasticsearchAdapter } from './adapters/elasticsearch.adapter';
import { NoopSearchAdapter } from '@/infrastructure/search/adapters/noopsearch.adapter';
import { SEARCH_ADAPTER } from './search.constants';
import { IndexManagerService } from '@/infrastructure/search/adapters/es_indices/index-manager.service';
import { ConfigService } from '@nestjs/config';
import { isTruthyEnv } from '@/common/utils/is-truthy-env.util';

@Module({})
export class SearchModule {
  static register(): DynamicModule {
    return {
      module: SearchModule,

      imports: [
        ElasticsearchModule.registerAsync({
          inject: [ConfigService],

          useFactory: (config: ConfigService) => ({
            node: config.get('ELASTICSEARCH_NODE'),
            auth: {
              username: config.get<string>('ELASTICSEARCH_USERNAME', 'elastic'),
              password: config.get<string>('ELASTICSEARCH_PASSWORD', ''),
            },

            tls: {
              rejectUnauthorized: false,
            },
          }),
        }),
      ],

      providers: [
        SearchService,
        IndexManagerService,
        ElasticsearchAdapter,
        NoopSearchAdapter,
        {
          provide: SEARCH_ADAPTER,

          inject: [ConfigService, ElasticsearchAdapter, NoopSearchAdapter],
          useFactory: (
            config: ConfigService,
            real: ElasticsearchAdapter,
            dummy: NoopSearchAdapter
          ) => {
            const enabled = isTruthyEnv(config.get('ELASTICSEARCH_ENABLED'));
            return enabled ? real : dummy;
          },
        },
      ],
      exports: [SearchService],
    };
  }
}
