export declare class StorageError extends Error {
    readonly cause?: unknown | undefined;
    constructor(message: string, cause?: unknown | undefined);
}
export declare class StorageNotFoundError extends StorageError {
}
export declare class StorageAccessError extends StorageError {
}
export declare class StorageConflictError extends StorageError {
}
export declare class StorageOperationError extends StorageError {
}
export declare class ScopeViolationError extends StorageError {
}
//# sourceMappingURL=storage-error.d.ts.map