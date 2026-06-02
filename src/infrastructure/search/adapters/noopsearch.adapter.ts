// Used when search is not implemented
import { Logger, Injectable } from '@nestjs/common';
import {
  SearchAdapter,
  SearchBulkDocument,
} from '@/infrastructure/search/interfaces/search-adapter.interface';

@Injectable()
export class NoopSearchAdapter implements SearchAdapter {
  private readonly logger = new Logger(NoopSearchAdapter.name);

  bulkIndex(index: string, documents: SearchBulkDocument[]): Promise<void> {
    this.logger.log(
      `Received ${documents.length} documents to index in index "${index}", but NoopSearchAdapter does not perform any indexing.`
    );
    return Promise.resolve();
  }

  search<T>(): Promise<T[]> {
    this.logger.log('Received search results from index');
    return Promise.resolve([]);
  }
}
