export interface SearchHit<T> {
    id: string;
    score?: number;
    source: T;
    highlight?: Record<string, string[]>;
}

export interface SearchBulkDocument {
    id: string;
    document: Record<string, unknown>;
    languageCode?: string;
}

export interface SearchAdapter {
    bulkIndex(index: string, documents: SearchBulkDocument[]): Promise<void>;

    search<T>(index: string, query: unknown): Promise<SearchHit<T>[]>;

    //TODO: implement bulk delete if needed
    // bulkDelete?(index: string, ids: string[]): Promise<void>;
}
