import { Readable } from 'node:stream';

import type { Storage } from '../core/port/storage.port.js';
import type { ScopeStrategy } from '../core/port/scope-strategy.port.js';
import { ScopeContext } from '../core/port/scope-context.port.js';
import {
  StorageNotFoundError,
  StorageOperationError,
} from '../core/domain/storage-error.js';
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
import { PrefixScopeStrategy } from '../core/domain/prefix-scope-strategy.js';
import type { StorageScopeConfig } from '../core/domain/scope.js';

interface StoredEntry {
  key: string;
  body: Buffer;
  contentType?: string;
  metadata: Record<string, string>;
  lastModified: Date;
}

export class InMemoryStorage implements Storage {
  private readonly entries = new Map<string, StoredEntry>();

  constructor(
    private readonly scope: ScopeStrategy = new PrefixScopeStrategy(undefined),
    private readonly scopeCtx: ScopeContext = new ScopeContext(),
  ) {}

  async put(input: PutObjectInput): Promise<StorageMetadata> {
    const physicalKey = this.resolvePhysical(input.key);
    const body = await toBuffer(input.body);
    const entry: StoredEntry = {
      key: physicalKey,
      body,
      contentType: input.contentType,
      metadata: input.metadata ?? {},
      lastModified: new Date(),
    };
    this.entries.set(physicalKey, entry);
    return this.toMetadata(input.key, entry);
  }

  async get(key: string): Promise<StorageObject> {
    const physicalKey = this.resolvePhysical(key);
    const entry = this.entries.get(physicalKey);
    if (!entry) throw new StorageNotFoundError(`Object not found: ${key}`);
    return {
      ...this.toMetadata(key, entry),
      body: Readable.from(entry.body),
    };
  }

  async head(key: string): Promise<StorageMetadata> {
    const physicalKey = this.resolvePhysical(key);
    const entry = this.entries.get(physicalKey);
    if (!entry) throw new StorageNotFoundError(`Object not found: ${key}`);
    return this.toMetadata(key, entry);
  }

  async exists(key: string): Promise<boolean> {
    const physicalKey = this.resolvePhysical(key);
    return this.entries.has(physicalKey);
  }

  async delete(key: string): Promise<void> {
    const physicalKey = this.resolvePhysical(key);
    this.entries.delete(physicalKey);
  }

  async list(options: ListObjectsOptions = {}): Promise<ListObjectsResult> {
    const physicalPrefix = options.prefix
      ? this.resolvePhysical(options.prefix)
      : this.resolvePhysical('');
    const limit = options.limit ?? 100;

    const matching = [...this.entries.values()]
      .filter((e) => e.key.startsWith(physicalPrefix))
      .sort((a, b) => a.key.localeCompare(b.key));

    let startIdx = 0;
    if (options.cursor) {
      const idx = matching.findIndex((e) => e.key === options.cursor);
      if (idx >= 0) startIdx = idx + 1;
    }

    const slice = matching.slice(startIdx, startIdx + limit);
    const nextCursor =
      matching.length > startIdx + limit
        ? slice[slice.length - 1].key
        : undefined;

    return {
      objects: slice.map((e) => this.toMetadata(this.toLogicalKey(e.key), e)),
      nextCursor,
    };
  }

  async createUploadUrl(input: CreateUploadUrlInput): Promise<PresignedUrl> {
    const physicalKey = this.resolvePhysical(input.key);
    const expiresIn = input.expiresIn ?? 900;
    return {
      url: `memory://upload/${encodeURIComponent(physicalKey)}`,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      method: 'PUT',
      key: input.key,
    };
  }

  async createDownloadUrl(
    input: CreateDownloadUrlInput,
  ): Promise<PresignedUrl> {
    const physicalKey = this.resolvePhysical(input.key);
    const expiresIn = input.expiresIn ?? 900;
    return {
      url: `memory://download/${encodeURIComponent(physicalKey)}`,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      method: 'GET',
      key: input.key,
    };
  }

  // --- internals ---

  private resolvePhysical(logicalKey: string): string {
    const scope = this.scopeCtx.get();
    return this.scope.resolve(logicalKey, scope);
  }

  private toLogicalKey(physicalKey: string): string {
    // In-memory adapter only supports a simple reconstruction.
    // For contract tests without scope, physical == logical.
    return physicalKey;
  }

  private toMetadata(logicalKey: string, entry: StoredEntry): StorageMetadata {
    return {
      key: logicalKey,
      contentType: entry.contentType,
      contentLength: entry.body.byteLength,
      metadata: entry.metadata,
      lastModified: entry.lastModified,
    };
  }
}

async function toBuffer(body: PutObjectInput['body']): Promise<Buffer> {
  if (Buffer.isBuffer(body)) return body;
  if (typeof body === 'string') return Buffer.from(body);
  if (body instanceof Uint8Array) return Buffer.from(body);
  const chunks: Buffer[] = [];
  for await (const chunk of body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
