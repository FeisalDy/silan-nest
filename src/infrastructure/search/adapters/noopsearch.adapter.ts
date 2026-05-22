// Used when search is not implemented
import { Injectable } from '@nestjs/common';
import { SearchAdapter, SearchBulkDocument } from '@/infrastructure/search/interfaces/search-adapter.interface';

@Injectable()
export class NoopSearchAdapter implements SearchAdapter {

  bulkIndex(index: string, documents: SearchBulkDocument[]): Promise<void> {
    return Promise.resolve();
  }

  search<T>(): Promise<T[]> {
    return Promise.resolve([]);
  }
}