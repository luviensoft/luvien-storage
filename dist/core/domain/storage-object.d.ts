import type { Readable } from 'node:stream';
export interface StorageMetadata {
    key: string;
    contentType?: string;
    contentLength?: number;
    etag?: string;
    metadata: Record<string, string>;
    lastModified?: Date;
}
export interface StorageObject extends StorageMetadata {
    body: Readable;
}
export type ObjectBody = Buffer | Uint8Array | Readable | string;
export interface PutObjectInput {
    key: string;
    body: ObjectBody;
    contentType?: string;
    contentLength?: number;
    metadata?: Record<string, string>;
}
export interface ListObjectsOptions {
    prefix?: string;
    limit?: number;
    cursor?: string;
}
export interface ListObjectsResult {
    objects: StorageMetadata[];
    nextCursor?: string;
}
export interface CreateUploadUrlInput {
    key: string;
    contentType?: string;
    expiresIn?: number;
    metadata?: Record<string, string>;
}
export interface CreateDownloadUrlInput {
    key: string;
    expiresIn?: number;
    responseContentDisposition?: string;
    responseContentType?: string;
}
export interface PresignedUrl {
    url: string;
    expiresAt: Date;
    method: 'GET' | 'PUT';
    key: string;
}
//# sourceMappingURL=storage-object.d.ts.map