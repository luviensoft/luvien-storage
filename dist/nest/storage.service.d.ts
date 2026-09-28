import { type Storage } from '../core/port/storage.port.js';
import type { CreateDownloadUrlInput, CreateUploadUrlInput, ListObjectsOptions, ListObjectsResult, PresignedUrl, PutObjectInput, StorageMetadata, StorageObject } from '../core/domain/storage-object.js';
export declare class StorageService {
    private readonly storage;
    constructor(storage: Storage);
    put(input: PutObjectInput): Promise<StorageMetadata>;
    get(key: string): Promise<StorageObject>;
    head(key: string): Promise<StorageMetadata>;
    exists(key: string): Promise<boolean>;
    delete(key: string): Promise<void>;
    list(options?: ListObjectsOptions): Promise<ListObjectsResult>;
    createUploadUrl(input: CreateUploadUrlInput): Promise<PresignedUrl>;
    createDownloadUrl(input: CreateDownloadUrlInput): Promise<PresignedUrl>;
}
//# sourceMappingURL=storage.service.d.ts.map