import { DynamicModule, Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

import { SearchService } from './search.service';
import { ElasticsearchAdapter } from './adapters/elasticsearch.adapter';
import { NoopSearchAdapter } from '@/infrastructure/search/adapters/noopsearch.adapter';
import { SEARCH_ADAPTER } from './search.constants';
import { IndexManagerService } from '@/infrastructure/search/indices/index-manager.service';
import { ConfigService } from '@nestjs/config';

@Module({})
export class SearchModule {
  static register(): DynamicModule {
    return {
      module: SearchModule,

      imports: [ElasticsearchModule.registerAsync({
        inject: [ConfigService],

        useFactory: (config: ConfigService) => ({
          node: config.get('ELASTICSEARCH_NODE') || 'http://localhost:9200',
        }),
      })],

      providers: [SearchService, IndexManagerService, ElasticsearchAdapter, NoopSearchAdapter, {
        provide: SEARCH_ADAPTER,

        inject: [ConfigService, ElasticsearchAdapter, NoopSearchAdapter], useFactory: (config: ConfigService,
          real: ElasticsearchAdapter,
          dummy: NoopSearchAdapter) => {
          const enabled = config.get('ELASTICSEARCH_ENABLED') === 'true';
          return enabled ? real : dummy;
        },
      }], exports: [SearchService],
    };
  }
}