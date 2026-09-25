export interface S3StorageConfig {
  bucket: string;
  region: string;
  endpoint?: string;
  forcePathStyle?: boolean;
  accessKeyId?: string;
  secretAccessKey?: string;
  /** Default presigned URL expiry in seconds. */
  defaultUrlExpirySeconds?: number;
}
