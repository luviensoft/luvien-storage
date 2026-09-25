import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LocalStorage } from './local.storage.js';
import { PrefixScopeStrategy } from '../../core/domain/prefix-scope-strategy.js';
import { ScopeContext } from '../../core/port/scope-context.port.js';
import { describeStorageContract } from '../../testing/contracts/storage.contract.js';
import { StorageAccessError } from '../../core/domain/storage-error.js';

describeStorageContract('LocalStorage', {
  supportsPresignedUrls: false,
  build: async () => {
    const dir = await mkdtemp(join(tmpdir(), 'luvien-storage-'));
    const storage = new LocalStorage(
      { rootDir: dir },
      new PrefixScopeStrategy(undefined),
      new ScopeContext(),
    );
    // Track for cleanup
    cleanupDirs.push(dir);
    return storage;
  },
});

const cleanupDirs: string[] = [];

afterEach(async () => {
  while (cleanupDirs.length) {
    const dir = cleanupDirs.pop()!;
    await rm(dir, { recursive: true, force: true });
  }
});

describe('LocalStorage path safety', () => {
  let dir: string;
  let storage: LocalStorage;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'luvien-storage-safe-'));
    storage = new LocalStorage(
      { rootDir: dir },
      new PrefixScopeStrategy(undefined),
      new ScopeContext(),
    );
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('rejects keys with .. segments', async () => {
    await expect(
      storage.put({ key: '../escape.txt', body: Buffer.from('x') }),
    ).rejects.toThrow();
  });

  it('rejects empty keys', async () => {
    await expect(
      storage.put({ key: '', body: Buffer.from('x') }),
    ).rejects.toThrow();
  });

  it('does not escape root via sibling prefix', async () => {
    // Create a sibling directory whose name shares a prefix with root.
    const sibling = dir + '-evil';
    await mkdir(sibling, { recursive: true });
    await writeFile(join(sibling, 'secret.txt'), 'secret');

    // The prefix check uses sep, so /tmp/foo-evil cannot match /tmp/foo.
    // Verify that a crafted key cannot resolve into the sibling.
    await expect(
      storage.get('../' + sibling.split('/').pop() + '/secret.txt'),
    ).rejects.toThrow();

    await rm(sibling, { recursive: true, force: true });
  });
});
