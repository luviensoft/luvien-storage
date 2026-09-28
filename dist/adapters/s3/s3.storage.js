import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand, ListObjectsV2Command, } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'node:stream';
import { StorageNotFoundError } from '../../core/domain/storage-error.js';
import { mapS3Error } from './s3-error-mapper.js';
const DEFAULT_URL_EXPIRY = 15 * 60;
export class S3Storage {
    scope;
    scopeCtx;
    client;
    bucket;
    defaultUrlExpiry;
    constructor(config, scope, scopeCtx) {
        this.scope = scope;
        this.scopeCtx = scopeCtx;
        this.bucket = config.bucket;
        this.defaultUrlExpiry =
            config.defaultUrlExpirySeconds ?? DEFAULT_URL_EXPIRY;
        this.client = new S3Client({
            region: config.region,
            endpoint: config.endpoint,
            forcePathStyle: config.forcePathStyle ?? Boolean(config.endpoint),
            credentials: config.accessKeyId && config.secretAccessKey
                ? {
                    accessKeyId: config.accessKeyId,
                    secretAccessKey: config.secretAccessKey,
                }
                : undefined,
            requestChecksumCalculation: 'WHEN_REQUIRED',
            responseChecksumValidation: 'WHEN_REQUIRED',
        });
    }
    async put(input) {
        const physicalKey = this.resolvePhysical(input.key);
        try {
            await this.client.send(new PutObjectCommand({
                Bucket: this.bucket,
                Key: physicalKey,
                Body: toSdkBody(input.body),
                ContentType: input.contentType,
                ContentLength: input.contentLength,
                Metadata: input.metadata,
            }));
        }
        catch (err) {
            throw mapS3Error(err, `Failed to put object: ${input.key}`);
        }
        return this.head(input.key);
    }
    async get(key) {
        const physicalKey = this.resolvePhysical(key);
        let res;
        try {
            res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: physicalKey }));
        }
        catch (err) {
            throw mapS3Error(err, `Failed to get object: ${key}`);
        }
        if (!res.Body) {
            throw mapS3Error(new Error('Empty body'), `Failed to get object: ${key}`);
        }
        return {
            key,
            contentType: res.ContentType,
            contentLength: res.ContentLength,
            etag: res.ETag,
            metadata: res.Metadata ?? {},
            lastModified: res.LastModified,
            body: res.Body,
        };
    }
    async head(key) {
        const physicalKey = this.resolvePhysical(key);
        try {
            const res = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: physicalKey }));
            return {
                key,
                contentType: res.ContentType,
                contentLength: res.ContentLength,
                etag: res.ETag,
                metadata: res.Metadata ?? {},
                lastModified: res.LastModified,
            };
        }
        catch (err) {
            throw mapS3Error(err, `Failed to head object: ${key}`);
        }
    }
    async exists(key) {
        try {
            await this.head(key);
            return true;
        }
        catch (err) {
            if (err instanceof StorageNotFoundError)
                return false;
            throw err;
        }
    }
    async delete(key) {
        const physicalKey = this.resolvePhysical(key);
        try {
            await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: physicalKey }));
        }
        catch (err) {
            throw mapS3Error(err, `Failed to delete object: ${key}`);
        }
    }
    async list(options = {}) {
        const physicalPrefix = options.prefix
            ? this.resolvePhysical(options.prefix)
            : this.resolvePhysical('');
        try {
            const res = await this.client.send(new ListObjectsV2Command({
                Bucket: this.bucket,
                Prefix: physicalPrefix || undefined,
                MaxKeys: options.limit ?? 100,
                ContinuationToken: options.cursor,
            }));
            const objects = (res.Contents ?? []).map((obj) => ({
                key: obj.Key ?? '',
                contentLength: obj.Size,
                etag: obj.ETag,
                metadata: {},
                lastModified: obj.LastModified,
            }));
            return {
                objects,
                nextCursor: res.IsTruncated ? res.NextContinuationToken : undefined,
            };
        }
        catch (err) {
            throw mapS3Error(err, 'Failed to list objects');
        }
    }
    async createUploadUrl(input) {
        const physicalKey = this.resolvePhysical(input.key);
        const expiresIn = input.expiresIn ?? this.defaultUrlExpiry;
        try {
            const url = await getSignedUrl(this.client, new PutObjectCommand({
                Bucket: this.bucket,
                Key: physicalKey,
                ContentType: input.contentType,
                Metadata: input.metadata,
            }), { expiresIn });
            return {
                url,
                expiresAt: new Date(Date.now() + expiresIn * 1000),
                method: 'PUT',
                key: input.key,
            };
        }
        catch (err) {
            throw mapS3Error(err, `Failed to create upload URL: ${input.key}`);
        }
    }
    async createDownloadUrl(input) {
        const physicalKey = this.resolvePhysical(input.key);
        const expiresIn = input.expiresIn ?? this.defaultUrlExpiry;
        try {
            const url = await getSignedUrl(this.client, new GetObjectCommand({
                Bucket: this.bucket,
                Key: physicalKey,
                ResponseContentDisposition: input.responseContentDisposition,
                ResponseContentType: input.responseContentType,
            }), { expiresIn });
            return {
                url,
                expiresAt: new Date(Date.now() + expiresIn * 1000),
                method: 'GET',
                key: input.key,
            };
        }
        catch (err) {
            throw mapS3Error(err, `Failed to create download URL: ${input.key}`);
        }
    }
    resolvePhysical(logicalKey) {
        const scope = this.scopeCtx.get();
        return this.scope.resolve(logicalKey, scope);
    }
}
function toSdkBody(body) {
    if (typeof body === 'string')
        return body;
    if (body instanceof Readable)
        return body;
    return body;
}
//# sourceMappingURL=s3.storage.js.map