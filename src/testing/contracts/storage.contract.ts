import { describe, it, expect, beforeEach } from 'vitest';
import { Readable } from 'node:stream';
import type { Storage } from '../../core/port/storage.port.js';
import { StorageNotFoundError } from '../../core/domain/storage-error.js';

export interface StorageContractHarness {
  /** Build a fresh Storage instance. Called before each test. */
  build(): Promise<Storage> | Storage;
  /** Whether this adapter supports presigned URLs. */
  supportsPresignedUrls: boolean;
}

export function describeStorageContract(
  name: string,
  harness: StorageContractHarness,
): void {
  describe(`Storage contract: ${name}`, () => {
    let storage: Storage;

    beforeEach(async () => {
      storage = await harness.build();
    });

    it('put then head returns metadata', async () => {
      await storage.put({
        key: 'a/b.txt',
        body: Buffer.from('hello'),
        contentType: 'text/plain',
      });
      const meta = await storage.head('a/b.txt');
      expect(meta.key).toBe('a/b.txt');
      expect(meta.contentLength).toBe(5);
    });

    it('put then get returns body', async () => {
      await storage.put({ key: 'a/b.txt', body: Buffer.from('hello') });
      const obj = await storage.get('a/b.txt');
      const chunks: Buffer[] = [];
      for await (const c of obj.body) chunks.push(Buffer.from(c));
      expect(Buffer.concat(chunks).toString()).toBe('hello');
    });

    it('exists reflects presence', async () => {
      expect(await storage.exists('a/b.txt')).toBe(false);
      await storage.put({ key: 'a/b.txt', body: Buffer.from('x') });
      expect(await storage.exists('a/b.txt')).toBe(true);
    });

    it('delete removes object', async () => {
      await storage.put({ key: 'a/b.txt', body: Buffer.from('x') });
      await storage.delete('a/b.txt');
      expect(await storage.exists('a/b.txt')).toBe(false);
    });

    it('delete is idempotent', async () => {
      await expect(storage.delete('missing')).resolves.toBeUndefined();
    });

    it('head on missing throws StorageNotFoundError', async () => {
      await expect(storage.head('missing')).rejects.toBeInstanceOf(
        StorageNotFoundError,
      );
    });

    it('get on missing throws StorageNotFoundError', async () => {
      await expect(storage.get('missing')).rejects.toBeInstanceOf(
        StorageNotFoundError,
      );
    });

    it('list with prefix returns only matching keys', async () => {
      await storage.put({ key: 'a/1.txt', body: Buffer.from('1') });
      await storage.put({ key: 'a/2.txt', body: Buffer.from('2') });
      await storage.put({ key: 'b/3.txt', body: Buffer.from('3') });
      const result = await storage.list({ prefix: 'a/' });
      const keys = result.objects.map((o) => o.key).sort();
      expect(keys).toEqual(['a/1.txt', 'a/2.txt']);
    });

    it('put accepts a stream body', async () => {
      await storage.put({
        key: 'stream.txt',
        body: Readable.from([Buffer.from('str'), Buffer.from('eam')]),
      });
      const obj = await storage.get('stream.txt');
      const chunks: Buffer[] = [];
      for await (const c of obj.body) chunks.push(Buffer.from(c));
      expect(Buffer.concat(chunks).toString()).toBe('stream');
    });

    if (harness.supportsPresignedUrls) {
      it('createUploadUrl returns a PUT url', async () => {
        const u = await storage.createUploadUrl({ key: 'a/b.txt' });
        expect(u.method).toBe('PUT');
        expect(u.url).toMatch(/^https?:/);
      });

      it('createDownloadUrl returns a GET url', async () => {
        const u = await storage.createDownloadUrl({ key: 'a/b.txt' });
        expect(u.method).toBe('GET');
        expect(u.url).toMatch(/^https?:/);
      });
    }
  });
}
