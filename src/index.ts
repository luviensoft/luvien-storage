// Nest
export { StorageModule } from './nest/storage.module.js';
export { StorageService } from './nest/storage.service.js';
export type {
  StorageModuleOptions,
  StorageModuleAsyncOptions,
  StorageDriverConfig,
} from './nest/storage.module.js';

// Ports and tokens
export type { Storage } from './core/port/storage.port.js';
export { STORAGE } from './core/port/storage.port.js';
export { ScopeContext, SCOPE_CONTEXT } from './core/port/scope-context.port.js';
export type { ScopeStrategy } from './core/port/scope-strategy.port.js';
export { SCOPE_STRATEGY } from './core/port/scope-strategy.port.js';

// Domain types
export type {
  StorageObject,
  StorageMetadata,
  PutObjectInput,
  ObjectBody,
  ListObjectsOptions,
  ListObjectsResult,
  CreateUploadUrlInput,
  CreateDownloadUrlInput,
  PresignedUrl,
} from './core/domain/storage-object.js';
export type {
  DataScope,
  StorageScopeConfig,
  StorageScopeLevel,
} from './core/domain/scope.js';
export { PrefixScopeStrategy } from './core/domain/prefix-scope-strategy.js';
export { normalizeLogicalKey } from './core/domain/key.js';

// Errors
export {
  StorageError,
  StorageNotFoundError,
  StorageAccessError,
  StorageConflictError,
  StorageOperationError,
  ScopeViolationError,
} from './core/domain/storage-error.js';

// Adapters
export { S3Storage } from './adapters/s3/s3.storage.js';
export type { S3StorageConfig } from './adapters/s3/s3.config.js';
export { LocalStorage } from './adapters/local/local.storage.js';
export type { LocalStorageConfig } from './adapters/local/local.storage.js';

// Testing (also exported via ./testing subpath)
export { InMemoryStorage } from './testing/in-memory.storage.js';
