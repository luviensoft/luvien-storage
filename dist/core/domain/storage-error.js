export class StorageError extends Error {
    cause;
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = new.target.name;
        Error.captureStackTrace?.(this, new.target);
    }
}
export class StorageNotFoundError extends StorageError {
}
export class StorageAccessError extends StorageError {
}
export class StorageConflictError extends StorageError {
}
export class StorageOperationError extends StorageError {
}
export class ScopeViolationError extends StorageError {
}
//# sourceMappingURL=storage-error.js.map