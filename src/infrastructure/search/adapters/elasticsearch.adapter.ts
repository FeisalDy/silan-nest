import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SearchAdapter, SearchBulkDocument, SearchHit } from '../interfaces/search-adapter.interface';
import { estypes } from '@elastic/elasticsearch';

@Injectable()
export class ElasticsearchAdapter implements SearchAdapter {
  private readonly logger = new Logger(ElasticsearchAdapter.name);

  constructor(private readonly elastic: ElasticsearchService) {
  }

  async search<T>(index: string, query: estypes.QueryDslQueryContainer): Promise<SearchHit<T>[]> {
    const result = await this.elastic.search<T>({
      index, query, highlight: {
        fields: {
          content: {},
        },
      },
    });

    return result.hits.hits.map((hit) => ({
      id: hit._id!,

      score: hit._score ?? undefined,

      source: hit._source as T,

      highlight: hit.highlight,
    }));
  }

  async bulkIndex(index: string, documents: SearchBulkDocument[]): Promise<void> {
    if (!documents.length) {
      return;
    }

    const operations = documents.flatMap((doc) => [{
      index: {
        _index: index, _id: doc.id,
      },
    }, doc.document]);

    const response = await this.elastic.bulk({
      refresh: true, operations,
    });

    if (response.errors) {
      this.logger.error('Bulk indexing encountered errors');
    }
  }
}