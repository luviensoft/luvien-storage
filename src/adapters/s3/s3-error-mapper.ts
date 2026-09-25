import {
  StorageAccessError,
  StorageConflictError,
  StorageError,
  StorageNotFoundError,
  StorageOperationError,
} from '../../core/domain/storage-error.js';

interface S3Error {
  name?: string;
  $metadata?: { httpStatusCode?: number };
}

export function mapS3Error(err: unknown, context: string): StorageError {
  if (err instanceof StorageError) return err;

  const e = err as S3Error;

  switch (e?.name) {
    case 'NoSuchKey':
    case 'NotFound':
      return new StorageNotFoundError(context);
    case 'AccessDenied':
    case 'Forbidden':
      return new StorageAccessError(context);
    case 'Conflict':
    case 'BucketAlreadyExists':
      return new StorageConflictError(context);
    default: {
      const status = e?.$metadata?.httpStatusCode;
      if (status === 404) return new StorageNotFoundError(context);
      if (status === 403) return new StorageAccessError(context);
      if (status === 409) return new StorageConflictError(context);
      return new StorageOperationError(context, err);
    }
  }
}
