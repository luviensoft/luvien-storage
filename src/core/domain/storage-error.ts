export class StorageError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
    Error.captureStackTrace?.(this, new.target);
  }
}

export class StorageNotFoundError extends StorageError {}
export class StorageAccessError extends StorageError {}
export class StorageConflictError extends StorageError {}
export class StorageOperationError extends StorageError {}

export class ScopeViolationError extends StorageError {}
