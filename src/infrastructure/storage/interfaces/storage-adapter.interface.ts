export interface StorageAdapter {
    upload(
        key: string,
        buffer: Buffer,
        metadata?: Record<string, string>
    ): Promise<string>;

    download(key: string): Promise<Buffer>;

    delete(key: string): Promise<void>;

    exists(key: string): Promise<boolean>;

    getUrl?(key: string): Promise<string>;

    move?(source: string, target: string): Promise<void>;
}
