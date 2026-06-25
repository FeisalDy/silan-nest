import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
    SearchAdapter,
    SearchBulkDocument,
    SearchHit,
} from '../interfaces/search-adapter.interface';
import { estypes } from '@elastic/elasticsearch';
import { Lang } from '@/common/constants/lang.constant';

@Injectable()
export class ElasticsearchAdapter implements SearchAdapter {
    private readonly logger = new Logger(ElasticsearchAdapter.name);

    constructor(private readonly elastic: ElasticsearchService) {}

    async search<T>(
        index: string,
        query: estypes.QueryDslQueryContainer
    ): Promise<SearchHit<T>[]> {
        const result = await this.elastic.search<T>({
            index,
            query,
            highlight: {
                fields: {
                    content: {},
                    contentZh: {},
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

    async bulkIndex(
        index: string,
        documents: SearchBulkDocument[]
    ): Promise<void> {
        this.logger.log('Bulk Index running');
        if (!documents.length) {
            this.logger.log('No documents found.');
            return;
        }

        const operations = documents.flatMap((doc) => [
            {
                index: {
                    _index: index,
                    _id: doc.id,
                },
            },
            this.buildDocument(doc.document, doc.languageCode),
        ]);

        this.logger.log('Bulk Operations running', operations.slice(0, 3));

        const response = await this.elastic.bulk({
            refresh: true,
            operations,
        });

        if (response.errors) {
            this.logger.error('Bulk indexing encountered errors');
        }
    }

    private buildDocument(
        document: Record<string, unknown>,
        languageCode?: string
    ): Record<string, unknown> {
        const content = document.content;

        if (typeof content !== 'string') {
            return document;
        }

        const transformed = { ...document };

        delete transformed.content;

        switch (languageCode?.toLowerCase()) {
            case Lang.CHINESE_PRC:
                transformed.contentZh = content;
                break;

            default:
                transformed.content = content;
                break;
        }

        return transformed;
    }
}
