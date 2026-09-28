import { Readable } from 'node:stream';
import { ScopeContext } from '../core/port/scope-context.port.js';
import { StorageNotFoundError, } from '../core/domain/storage-error.js';
import { PrefixScopeStrategy } from '../core/domain/prefix-scope-strategy.js';
export class InMemoryStorage {
    scope;
    scopeCtx;
    entries = new Map();
    constructor(scope = new PrefixScopeStrategy(undefined), scopeCtx = new ScopeContext()) {
        this.scope = scope;
        this.scopeCtx = scopeCtx;
    }
    async put(input) {
        const physicalKey = this.resolvePhysical(input.key);
        const body = await toBuffer(input.body);
        const entry = {
            key: physicalKey,
            body,
            contentType: input.contentType,
            metadata: input.metadata ?? {},
            lastModified: new Date(),
        };
        this.entries.set(physicalKey, entry);
        return this.toMetadata(input.key, entry);
    }
    async get(key) {
        const physicalKey = this.resolvePhysical(key);
        const entry = this.entries.get(physicalKey);
        if (!entry)
            throw new StorageNotFoundError(`Object not found: ${key}`);
        return {
            ...this.toMetadata(key, entry),
            body: Readable.from(entry.body),
        };
    }
    async head(key) {
        const physicalKey = this.resolvePhysical(key);
        const entry = this.entries.get(physicalKey);
        if (!entry)
            throw new StorageNotFoundError(`Object not found: ${key}`);
        return this.toMetadata(key, entry);
    }
    async exists(key) {
        const physicalKey = this.resolvePhysical(key);
        return this.entries.has(physicalKey);
    }
    async delete(key) {
        const physicalKey = this.resolvePhysical(key);
        this.entries.delete(physicalKey);
    }
    async list(options = {}) {
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
            if (idx >= 0)
                startIdx = idx + 1;
        }
        const slice = matching.slice(startIdx, startIdx + limit);
        const nextCursor = matching.length > startIdx + limit
            ? slice[slice.length - 1].key
            : undefined;
        return {
            objects: slice.map((e) => this.toMetadata(this.toLogicalKey(e.key), e)),
            nextCursor,
        };
    }
    async createUploadUrl(input) {
        const physicalKey = this.resolvePhysical(input.key);
        const expiresIn = input.expiresIn ?? 900;
        return {
            url: `memory://upload/${encodeURIComponent(physicalKey)}`,
            expiresAt: new Date(Date.now() + expiresIn * 1000),
            method: 'PUT',
            key: input.key,
        };
    }
    async createDownloadUrl(input) {
        const physicalKey = this.resolvePhysical(input.key);
        const expiresIn = input.expiresIn ?? 900;
        return {
            url: `memory://download/${encodeURIComponent(physicalKey)}`,
            expiresAt: new Date(Date.now() + expiresIn * 1000),
            method: 'GET',
            key: input.key,
        };
    }
    resolvePhysical(logicalKey) {
        const scope = this.scopeCtx.get();
        return this.scope.resolve(logicalKey, scope);
    }
    toLogicalKey(physicalKey) {
        return physicalKey;
    }
    toMetadata(logicalKey, entry) {
        return {
            key: logicalKey,
            contentType: entry.contentType,
            contentLength: entry.body.byteLength,
            metadata: entry.metadata,
            lastModified: entry.lastModified,
        };
    }
}
async function toBuffer(body) {
    if (Buffer.isBuffer(body))
        return body;
    if (typeof body === 'string')
        return Buffer.from(body);
    if (body instanceof Uint8Array)
        return Buffer.from(body);
    const chunks = [];
    for await (const chunk of body) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
}
//# sourceMappingURL=in-memory.storage.js.map