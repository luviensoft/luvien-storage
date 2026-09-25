import { describe, it, expect, vi, beforeEach } from 'vitest';
import { S3Storage } from './s3.storage.js';
import { PrefixScopeStrategy } from '../../core/domain/prefix-scope-strategy.js';
import { ScopeContext } from '../../core/port/scope-context.port.js';
import {
  StorageNotFoundError,
  StorageAccessError,
} from '../../core/domain/storage-error.js';

// Mock the AWS SDK. Do not import real AWS calls.
vi.mock('@aws-sdk/client-s3', () => {
  const send = vi.fn();
  return {
    S3Client: vi.fn(() => ({ send })),
    PutObjectCommand: vi.fn((input) => ({ input, __type: 'Put' })),
    GetObjectCommand: vi.fn((input) => ({ input, __type: 'Get' })),
    HeadObjectCommand: vi.fn((input) => ({ input, __type: 'Head' })),
    DeleteObjectCommand: vi.fn((input) => ({ input, __type: 'Delete' })),
    ListObjectsV2Command: vi.fn((input) => ({ input, __type: 'List' })),
  };
});

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(async () => 'https://signed.example.com/upload'),
}));

import { S3Client } from '@aws-sdk/client-s3';

function buildStorage() {
  const scope = new PrefixScopeStrategy({
    levels: [{ name: 'tenant', field: 'tenantId' }],
  });
  const scopeCtx = new ScopeContext();
  scopeCtx.run({ tenantId: 't1' }, () => {});
  return {
    storage: new S3Storage(
      { bucket: 'b', region: 'us-east-1', endpoint: 'http://localhost:9000' },
      scope,
      scopeCtx,
    ),
    scopeCtx,
  };
}

describe('S3Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolvePhysical prefixes with scope inside the adapter', async () => {
    const { storage, scopeCtx } = buildStorage();

    let sentKey = '';
    const send = vi.fn(async (cmd: any) => {
      sentKey = cmd.input.Key;
      return { ContentLength: 5, Metadata: {}, LastModified: new Date() };
    });

    (
      S3Client as unknown as { mockImplementation: Function }
    ).mockImplementation(() => ({ send }));

    await scopeCtx.run({ tenantId: 't1' }, async () => {
      await storage.put({ key: 'a/b.txt', body: Buffer.from('hello') });
    });

    expect(sentKey).toBe('tenant/t1/a/b.txt');
  });

  it('maps 404 to StorageNotFoundError', async () => {
    const send = vi.fn(async () => {
      const err: any = new Error('not found');
      err.name = 'NoSuchKey';
      throw err;
    });
    (
      S3Client as unknown as { mockImplementation: Function }
    ).mockImplementation(() => ({ send }));

    const { storage } = buildStorage();
    await expect(storage.head('missing')).rejects.toBeInstanceOf(
      StorageNotFoundError,
    );
  });

  it('maps 403 to StorageAccessError', async () => {
    const send = vi.fn(async () => {
      const err: any = new Error('denied');
      err.name = 'AccessDenied';
      throw err;
    });
    (
      S3Client as unknown as { mockImplementation: Function }
    ).mockImplementation(() => ({ send }));

    const { storage } = buildStorage();
    await expect(storage.head('a')).rejects.toBeInstanceOf(StorageAccessError);
  });

  it('fails closed without scope when scope is configured', async () => {
    const scope = new PrefixScopeStrategy({
      levels: [{ name: 'tenant', field: 'tenantId' }],
    });
    const scopeCtx = new ScopeContext();
    const storage = new S3Storage(
      { bucket: 'b', region: 'us-east-1' },
      scope,
      scopeCtx,
    );

    await expect(
      storage.put({ key: 'a/b.txt', body: Buffer.from('x') }),
    ).rejects.toThrow();
  });
});
