export { StorageModule } from './nest/storage.module.js';
export { StorageService } from './nest/storage.service.js';
export { STORAGE } from './core/port/storage.port.js';
export { ScopeContext, SCOPE_CONTEXT } from './core/port/scope-context.port.js';
export { SCOPE_STRATEGY } from './core/port/scope-strategy.port.js';
export { PrefixScopeStrategy } from './core/domain/prefix-scope-strategy.js';
export { normalizeLogicalKey } from './core/domain/key.js';
export { StorageError, StorageNotFoundError, StorageAccessError, StorageConflictError, StorageOperationError, ScopeViolationError, } from './core/domain/storage-error.js';
export { S3Storage } from './adapters/s3/s3.storage.js';
export { LocalStorage } from './adapters/local/local.storage.js';
export { InMemoryStorage } from './testing/in-memory.storage.js';
//# sourceMappingURL=index.js.map