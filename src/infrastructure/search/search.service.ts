import { Inject, Injectable } from '@nestjs/common';
import { SEARCH_ADAPTER } from './search.tokens';
import {
    type SearchAdapter,
    SearchBulkDocument,
} from './interfaces/search-adapter.interface';
import { CHAPTER_TRANSLATION_INDEX } from '@/infrastructure/search/adapters/es_indices/chapters.index';
import { SearchableChapter } from '@/infrastructure/search/dto/searchable-chapter.dto';

@Injectable()
export class SearchService {
    constructor(
        @Inject(SEARCH_ADAPTER) private readonly adapter: SearchAdapter
    ) {}

    async search(query: string) {
        return this.adapter.search<SearchableChapter>(
            CHAPTER_TRANSLATION_INDEX,
            {
                multi_match: {
                    query,
                    fields: ['content', 'contentZh'],
                },
            }
        );
        // return this.adapter.search<SearchableChapter>(CHAPTER_TRANSLATION_INDEX, {
        //   match: {
        //     content: query,
        //   },
        // });
    }

    async bulkIndexChapters(documents: SearchBulkDocument[]) {
        return this.adapter.bulkIndex(CHAPTER_TRANSLATION_INDEX, documents);
    }
}
