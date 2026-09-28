import { createReadStream } from 'node:fs';
import { mkdir, stat, readdir, writeFile, unlink } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import { StorageNotFoundError, StorageOperationError, StorageAccessError, } from '../../core/domain/storage-error.js';
export class LocalStorage {
    scope;
    scopeCtx;
    root;
    constructor(config, scope, scopeCtx) {
        this.scope = scope;
        this.scopeCtx = scopeCtx;
        this.root = resolve(config.rootDir);
    }
    async put(input) {
        const physicalKey = this.resolvePhysical(input.key);
        const fullPath = this.toFullPath(physicalKey);
        await mkdir(dirname(fullPath), { recursive: true });
        try {
            if (input.body instanceof Readable) {
                await pipeline(input.body, createWriteStream(fullPath));
            }
            else if (typeof input.body === 'string') {
                await writeFile(fullPath, input.body);
            }
            else {
                await writeFile(fullPath, input.body);
            }
        }
        catch (err) {
            throw new StorageOperationError('Failed to write object', err);
        }
        const stats = await stat(fullPath);
        return {
            key: input.key,
            contentType: input.contentType,
            contentLength: stats.size,
            etag: undefined,
            metadata: input.metadata ?? {},
            lastModified: stats.mtime,
        };
    }
    async get(key) {
        const physicalKey = this.resolvePhysical(key);
        const fullPath = this.toFullPath(physicalKey);
        let stats;
        try {
            stats = await stat(fullPath);
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                throw new StorageNotFoundError(`Object not found: ${key}`);
            }
            throw new StorageAccessError('Failed to stat object', err);
        }
        if (!stats.isFile()) {
            throw new StorageNotFoundError(`Object is not a file: ${key}`);
        }
        return {
            key,
            contentType: undefined,
            contentLength: stats.size,
            etag: undefined,
            metadata: {},
            lastModified: stats.mtime,
            body: createReadStream(fullPath),
        };
    }
    async head(key) {
        const physicalKey = this.resolvePhysical(key);
        const fullPath = this.toFullPath(physicalKey);
        let stats;
        try {
            stats = await stat(fullPath);
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                throw new StorageNotFoundError(`Object not found: ${key}`);
            }
            throw new StorageAccessError('Failed to stat object', err);
        }
        if (!stats.isFile()) {
            throw new StorageNotFoundError(`Object is not a file: ${key}`);
        }
        return {
            key,
            contentType: undefined,
            contentLength: stats.size,
            etag: undefined,
            metadata: {},
            lastModified: stats.mtime,
        };
    }
    async exists(key) {
        const physicalKey = this.resolvePhysical(key);
        const fullPath = this.toFullPath(physicalKey);
        try {
            const stats = await stat(fullPath);
            return stats.isFile();
        }
        catch {
            return false;
        }
    }
    async delete(key) {
        const physicalKey = this.resolvePhysical(key);
        const fullPath = this.toFullPath(physicalKey);
        try {
            await unlink(fullPath);
        }
        catch (err) {
            if (err.code === 'ENOENT')
                return;
            throw new StorageOperationError('Failed to delete object', err);
        }
    }
    async list(options = {}) {
        const prefix = options.prefix
            ? this.resolvePhysical(options.prefix)
            : this.resolvePhysical('');
        const prefixPath = this.toFullPath(prefix);
        const limit = options.limit ?? 100;
        const results = [];
        const walk = async (dir) => {
            let entries;
            try {
                entries = await readdir(dir, { withFileTypes: true });
            }
            catch (err) {
                if (err.code === 'ENOENT')
                    return;
                throw new StorageAccessError('Failed to read directory', err);
            }
            for (const entry of entries) {
                if (results.length >= limit)
                    return;
                const full = join(dir, entry.name);
                if (entry.isDirectory()) {
                    await walk(full);
                }
                else if (entry.isFile()) {
                    const stats = await stat(full);
                    const logicalKey = full
                        .slice(this.root.length + 1)
                        .split(sep)
                        .join('/');
                    results.push({
                        key: logicalKey,
                        contentLength: stats.size,
                        metadata: {},
                        lastModified: stats.mtime,
                    });
                }
            }
        };
        const statPrefix = await stat(prefixPath).catch(() => null);
        if (statPrefix?.isDirectory()) {
            await walk(prefixPath);
        }
        else if (statPrefix?.isFile()) {
            const stats = statPrefix;
            const logicalKey = prefixPath
                .slice(this.root.length + 1)
                .split(sep)
                .join('/');
            results.push({
                key: logicalKey,
                contentLength: stats.size,
                metadata: {},
                lastModified: stats.mtime,
            });
        }
        else if (!options.prefix) {
            await walk(this.root);
        }
        let objects = results;
        if (options.cursor) {
            const idx = results.findIndex((o) => o.key === options.cursor);
            if (idx >= 0)
                objects = results.slice(idx + 1);
        }
        return {
            objects: objects.slice(0, limit),
            nextCursor: results.length > limit ? results[limit - 1].key : undefined,
        };
    }
    async createUploadUrl(input) {
        throw new StorageOperationError('Presigned URLs are not supported by LocalStorage');
    }
    async createDownloadUrl(input) {
        throw new StorageOperationError('Presigned URLs are not supported by LocalStorage');
    }
    resolvePhysical(logicalKey) {
        const scope = this.scopeCtx.get();
        return this.scope.resolve(logicalKey, scope);
    }
    toFullPath(physicalKey) {
        const full = resolve(this.root, physicalKey);
        if (full !== this.root && !full.startsWith(this.root + sep)) {
            throw new StorageAccessError('Resolved path escapes storage root');
        }
        return full;
    }
}
//# sourceMappingURL=local.storage.js.map