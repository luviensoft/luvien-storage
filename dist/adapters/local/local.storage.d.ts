import type { Storage } from '../../core/port/storage.port.js';
import type { ScopeStrategy } from '../../core/port/scope-strategy.port.js';
import type { ScopeContext } from '../../core/port/scope-context.port.js';
import type { CreateDownloadUrlInput, CreateUploadUrlInput, ListObjectsOptions, ListObjectsResult, PresignedUrl, PutObjectInput, StorageMetadata, StorageObject } from '../../core/domain/storage-object.js';
export interface LocalStorageConfig {
    rootDir: string;
}
export declare class LocalStorage implements Storage {
    private readonly scope;
    private readonly scopeCtx;
    private readonly root;
    constructor(config: LocalStorageConfig, scope: ScopeStrategy, scopeCtx: ScopeContext);
    put(input: PutObjectInput): Promise<StorageMetadata>;
    get(key: string): Promise<StorageObject>;
    head(key: string): Promise<StorageMetadata>;
    exists(key: string): Promise<boolean>;
    delete(key: string): Promise<void>;
    list(options?: ListObjectsOptions): Promise<ListObjectsResult>;
    createUploadUrl(input: CreateUploadUrlInput): Promise<PresignedUrl>;
    createDownloadUrl(input: CreateDownloadUrlInput): Promise<PresignedUrl>;
    private resolvePhysical;
    private toFullPath;
}
//# sourceMappingURL=local.storage.d.ts.map