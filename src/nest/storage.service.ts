import { Inject, Injectable } from '@nestjs/common';
import { STORAGE, type Storage } from '../core/port/storage.port.js';
import type {
  CreateDownloadUrlInput,
  CreateUploadUrlInput,
  ListObjectsOptions,
  ListObjectsResult,
  PresignedUrl,
  PutObjectInput,
  StorageMetadata,
  StorageObject,
} from '../core/domain/storage-object.js';

@Injectable()
export class StorageService {
  constructor(@Inject(STORAGE) private readonly storage: Storage) {}

  put(input: PutObjectInput): Promise<StorageMetadata> {
    return this.storage.put(input);
  }

  get(key: string): Promise<StorageObject> {
    return this.storage.get(key);
  }

  head(key: string): Promise<StorageMetadata> {
    return this.storage.head(key);
  }

  exists(key: string): Promise<boolean> {
    return this.storage.exists(key);
  }

  delete(key: string): Promise<void> {
    return this.storage.delete(key);
  }

  list(options?: ListObjectsOptions): Promise<ListObjectsResult> {
    return this.storage.list(options);
  }

  createUploadUrl(input: CreateUploadUrlInput): Promise<PresignedUrl> {
    return this.storage.createUploadUrl(input);
  }

  createDownloadUrl(input: CreateDownloadUrlInput): Promise<PresignedUrl> {
    return this.storage.createDownloadUrl(input);
  }
}
