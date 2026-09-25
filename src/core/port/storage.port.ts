import type {
  CreateDownloadUrlInput,
  CreateUploadUrlInput,
  ListObjectsOptions,
  ListObjectsResult,
  PresignedUrl,
  PutObjectInput,
  StorageMetadata,
  StorageObject,
} from '../domain/storage-object.js';

export const STORAGE = 'luvien:storage:storage';

export interface Storage {
  put(input: PutObjectInput): Promise<StorageMetadata>;

  get(key: string): Promise<StorageObject>;

  head(key: string): Promise<StorageMetadata>;

  exists(key: string): Promise<boolean>;

  delete(key: string): Promise<void>;

  list(options?: ListObjectsOptions): Promise<ListObjectsResult>;

  createUploadUrl(input: CreateUploadUrlInput): Promise<PresignedUrl>;

  createDownloadUrl(input: CreateDownloadUrlInput): Promise<PresignedUrl>;
}
