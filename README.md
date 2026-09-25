# @luvien/storage

Object storage infrastructure for the Luvien ecosystem.

`@luvien/storage` provides a provider-agnostic object storage abstraction for NestJS applications. The same application code can work with S3-compatible storage, a local filesystem, or an in-memory backend for testing.

The library is **infrastructure, not an application framework**. It does not own business concepts, file records, upload endpoints, or authorization rules.

## Features

* Provider-agnostic `Storage` port
* S3-compatible adapter for AWS S3 and self-hosted providers
* Local filesystem adapter with path-traversal protection
* In-memory adapter for testing
* Presigned upload and download URLs
* Ordered, fail-closed scope prefixes
* Normalized storage errors
* NestJS `StorageModule`
* Synchronous and asynchronous registration
* Reusable adapter contract tests
* No `process.env` access inside the library
* No HTTP, Express, or Multer types in the public contract

## Architecture

```text
Application
    │
    ▼
@luvien/storage
    │
    ├── core/
    │     Storage port, scope, domain types, errors
    │
    ├── adapters/
    │     S3, Local
    │
    ├── testing/
    │     InMemory, contract tests
    │
    └── nest/
          StorageModule, StorageService
              │
              ▼
      S3-compatible / filesystem
```

The application owns business meaning. Storage owns object persistence.

```text
Business key
    owned by the application

    invoices/2026/INV-0001.pdf

Scope
    owned by the application

    { tenantId: 'tenant-1', outletId: 'outlet-10' }

Physical key
    produced by @luvien/storage

    tenant/tenant-1/outlet/outlet-10/invoices/2026/INV-0001.pdf
```

`@luvien/storage` takes the application-owned logical key, applies the configured scope, and sends the resulting physical key to the storage provider.

The library does not know what a key means to the business.

## Installation

```bash
bun add github:luviensoft/luvien-storage
```

NestJS applications require `@nestjs/common` and `@nestjs/core` as peer dependencies.

The S3 adapter uses:

```text
@aws-sdk/client-s3
@aws-sdk/s3-request-presigner
```

These are runtime dependencies of the package.

Testing utilities are available from:

```typescript
import { InMemoryStorage } from '@luvien/storage/testing';
```

## Quick start

### Local storage

```typescript
import { Module } from '@nestjs/common';
import { StorageModule } from '@luvien/storage';

@Module({
  imports: [
    StorageModule.forRoot({
      driver: {
        driver: 'local',
        local: {
          rootDir: './var/storage',
        },
      },
    }),
  ],
})
export class AppModule {}
```

### Inject storage

```typescript
import { Injectable } from '@nestjs/common';
import { StorageService } from '@luvien/storage';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly storage: StorageService,
  ) {}

  async attachInvoice(id: string, pdf: Buffer) {
    return this.storage.put({
      key: `invoices/2026/${id}.pdf`,
      body: pdf,
      contentType: 'application/pdf',
    });
  }
}
```

### Presigned upload

```typescript
const upload = await this.storage.createUploadUrl({
  key: `invoices/2026/${id}.pdf`,
  contentType: 'application/pdf',
  expiresIn: 300,
});

return {
  uploadUrl: upload.url,
};
```

The client uploads directly to the storage provider without receiving storage credentials.

## Configuration

```typescript
interface StorageModuleOptions {
  driver: StorageDriverConfig;
  scope?: StorageScopeConfig;
}

type StorageDriverConfig =
  | {
      driver: 's3';
      s3: {
        bucket: string;
        region: string;
        endpoint?: string;
        forcePathStyle?: boolean;
        accessKeyId?: string;
        secretAccessKey?: string;
        defaultUrlExpirySeconds?: number;
      };
    }
  | {
      driver: 'local';
      local: {
        rootDir: string;
      };
    };
```

Async registration:

```typescript
StorageModule.forRootAsync({
  inject: [APPLICATION_CONFIG],
  useFactory: (config: ApplicationConfig) => config.storage,
});
```

The application owns environment loading and configuration composition.

`@luvien/storage` does not read `process.env` directly.

## Storage API

```typescript
interface Storage {
  put(input: PutObjectInput): Promise<StorageMetadata>;

  get(key: string): Promise<StorageObject>;

  head(key: string): Promise<StorageMetadata>;

  exists(key: string): Promise<boolean>;

  delete(key: string): Promise<void>;

  list(options?: ListObjectsOptions): Promise<ListObjectsResult>;

  createUploadUrl(
    input: CreateUploadUrlInput,
  ): Promise<PresignedUrl>;

  createDownloadUrl(
    input: CreateDownloadUrlInput,
  ): Promise<PresignedUrl>;
}
```

### `put`

```typescript
await storage.put({
  key: 'invoices/2026/INV-0001.pdf',
  body: pdfBuffer,
  contentType: 'application/pdf',
  contentLength: pdfBuffer.length,
  metadata: {
    uploadedBy: 'user-42',
  },
});
```

Supported bodies:

```text
Buffer
Uint8Array
Readable
string
```

`put` returns metadata and does not return the object body.

### `get`

```typescript
const object = await storage.get(
  'invoices/2026/INV-0001.pdf',
);

object.body.pipe(response);
```

`get` returns a `Readable` body.

Large objects should be consumed as streams rather than loaded entirely into memory.

### `head`

```typescript
const metadata = await storage.head(
  'invoices/2026/INV-0001.pdf',
);
```

Returns metadata without downloading the object body.

### `exists`

```typescript
if (await storage.exists('invoices/2026/INV-0001.pdf')) {
  // object exists
}
```

`exists` is implemented using `head`.

It returns `false` for missing objects and throws for access or operation errors.

### `delete`

```typescript
await storage.delete(
  'invoices/2026/INV-0001.pdf',
);
```

Delete is idempotent. Deleting a missing object succeeds.

### `list`

```typescript
const result = await storage.list({
  prefix: 'invoices/2026',
  limit: 100,
});

for (const object of result.objects) {
  // object.key is the logical key
}
```

`limit` defaults to `100`.

`cursor` is opaque. Pass `nextCursor` from the previous response to continue pagination.

When scopes are enabled, `prefix` is resolved inside the active scope.

## Object Keys

Object keys are **application-owned**.

The library does not generate business-specific paths.

```text
invoices/2026/INV-0001.pdf
users/42/avatar.png
reports/monthly/2026-09.pdf
```

The library validates and normalizes logical keys before applying the storage scope.

### Key rules

| Input      | Result  | Notes                            |
| ---------- | ------- | -------------------------------- |
| `a//b///c` | `a/b/c` | Duplicate slashes collapsed      |
| `/a/b/`    | `a/b`   | Leading/trailing slashes removed |
| `a/./b`    | `a/b`   | Dot segments removed             |
| `a/../b`   | Throws  | `..` is rejected                 |
| ``         | Throws  | Empty keys are rejected          |
| `///`      | Throws  | Resolves to an empty key         |
| `a/$%^/b`  | Throws  | Invalid characters               |

Allowed characters per segment:

```text
A-Z
a-z
0-9
.
_
-
```

Keys longer than `1024` characters are rejected.

Invalid keys throw `ScopeViolationError`.

The same validation is applied regardless of the storage driver.

## Scopes

Storage scopes isolate objects by namespace prefix.

They are the object-storage equivalent of database row scoping, but are implemented as physical key prefixes rather than SQL predicates.

```typescript
StorageModule.forRoot({
  driver: {
    driver: 's3',
    s3: {
      bucket: 'my-bucket',
      region: 'us-east-1',
    },
  },
  scope: {
    levels: [
      { name: 'tenant', field: 'tenantId' },
      { name: 'outlet', field: 'outletId' },
    ],
  },
});
```

Given:

```typescript
{
  tenantId: 'tenant-1',
  outletId: 'outlet-10',
}
```

and:

```text
invoices/2026/a.pdf
```

the physical key becomes:

```text
tenant/tenant-1/outlet/outlet-10/invoices/2026/a.pdf
```

Scope levels are applied in declaration order.

### Scope ownership

The application owns the meaning and hierarchy of scopes.

For example:

```text
tenant → outlet
```

is an application/domain relationship.

`@luvien/storage` does not query the database to determine whether:

```text
outlet-10 belongs to tenant-1
```

The application must establish and validate the scope before calling storage.

Conceptually:

```text
HTTP request
    │
    ▼
Application middleware / guard
    │
    ├── identify tenant
    ├── identify outlet
    ├── validate relationship
    │
    ▼
ScopeContext
    │
    ├── tenantId
    └── outletId
    │
    ▼
Application service
    │
    ▼
@luvien/storage
```

### Fail-closed behavior

If scopes are configured and a required scope value is missing, the operation fails before reaching the provider.

The following operations are protected:

```text
put
get
head
exists
delete
list
createUploadUrl
createDownloadUrl
```

No operation may silently fall back to an unscoped root key.

For example, if `tenantId` is required but unavailable:

```text
ScopeViolationError
```

is thrown before any provider operation occurs.

Presigned URLs follow the same rule. A generated URL always points to the fully scoped physical key.

### Scope context

Scope values are read from `ScopeContext`, backed by `AsyncLocalStorage`.

Example:

```typescript
@Injectable()
export class TenantScopeMiddleware implements NestMiddleware {
  constructor(
    @Inject(SCOPE_CONTEXT)
    private readonly scope: ScopeContext,
  ) {}

  use(
    req: Request,
    _res: Response,
    next: NextFunction,
  ) {
    const tenantId = req.headers['x-tenant-id'];

    if (typeof tenantId !== 'string') {
      return next();
    }

    this.scope.run(
      { tenantId },
      () => next(),
    );
  }
}
```

The middleware/guard that establishes the scope is application-owned.

`@luvien/storage` only consumes the active scope and applies it deterministically.

### Unscoped storage

When `scope.levels` is empty or omitted, the physical key is the logical key.

This is the correct default for applications that do not require storage tenancy.

## Presigned URLs

Presigned URLs allow clients to upload or download objects directly without receiving storage credentials.

### Upload

```typescript
const upload = await storage.createUploadUrl({
  key: 'invoices/2026/a.pdf',
  contentType: 'application/pdf',
  expiresIn: 300,
});

upload.url;
upload.method;
upload.expiresAt;
```

### Download

```typescript
const download = await storage.createDownloadUrl({
  key: 'invoices/2026/a.pdf',
  expiresIn: 900,
  responseContentDisposition:
    'attachment; filename="invoice.pdf"',
});

download.url;
download.method;
download.expiresAt;
```

Presigned URLs always use the resolved physical key.

They never bypass the active storage scope.

`LocalStorage` does not support presigned URLs and throws `StorageOperationError`.

Use the S3 adapter when direct client-to-provider uploads or downloads are required.

## Adapters

### S3-compatible

The S3 adapter uses the standard S3 API and accepts a configurable endpoint.

```typescript
StorageModule.forRoot({
  driver: {
    driver: 's3',
    s3: {
      bucket: 'my-bucket',
      region: 'us-east-1',
      endpoint: 'http://localhost:8333',
      forcePathStyle: true,
      accessKeyId: 'access-key',
      secretAccessKey: 'secret-key',
    },
  },
});
```

The same adapter can be used with:

* AWS S3
* MinIO
* SeaweedFS
* RustFS
* Garage
* Ceph RGW
* other S3-compatible providers

`forcePathStyle` defaults to:

```text
true  when endpoint is configured
false when endpoint is not configured
```

The adapter must not contain provider-specific business logic.

### Checksum compatibility

AWS SDK v3.729.0 and later can automatically add CRC32 checksums to `PutObject` requests.

Some S3-compatible providers may reject or mishandle these checksums.

The adapter configures:

```typescript
requestChecksumCalculation: 'WHEN_REQUIRED',
responseChecksumValidation: 'WHEN_REQUIRED',
```

to avoid unnecessary checksum injection and improve S3 compatibility.

Applications requiring explicit checksum validation can provide a custom `S3Client` through a custom adapter.

### Local

```typescript
StorageModule.forRoot({
  driver: {
    driver: 'local',
    local: {
      rootDir: './var/storage',
    },
  },
});
```

Local storage:

* stores objects under the configured root directory
* applies the same logical-key validation
* applies storage scopes
* rejects path traversal
* verifies the resolved path remains inside the configured root
* does not support presigned URLs

Path validation must use path-aware resolution rather than a simple string-prefix comparison.

### In-memory

```typescript
import { InMemoryStorage } from '@luvien/storage/testing';

const storage = new InMemoryStorage();
```

The in-memory adapter is intended for unit tests.

It implements the same storage contract as the production adapters.

Its presigned URLs use a `memory://` scheme and are not fetchable. They exist only for testing the presigned URL contract.

## Errors

```text
StorageError
├── StorageNotFoundError
├── StorageAccessError
├── StorageConflictError
├── StorageOperationError
└── ScopeViolationError
```

Adapters translate provider-specific failures into these normalized errors.

AWS SDK errors and Node.js filesystem errors must not leak through the public API.

The original error may be retained as `cause` for diagnostics.

Never expose `cause` to API clients.

Example HTTP mapping:

```typescript
@Catch(StorageError)
export class StorageErrorFilter
  implements ExceptionFilter
{
  catch(
    err: StorageError,
    host: ArgumentsHost,
  ) {
    const response =
      host.switchToHttp().getResponse<Response>();

    let status = 500;
    let code = 'STORAGE_ERROR';

    if (err instanceof StorageNotFoundError) {
      status = 404;
      code = 'STORAGE_NOT_FOUND';
    } else if (err instanceof StorageAccessError) {
      status = 403;
      code = 'STORAGE_ACCESS_DENIED';
    } else if (err instanceof StorageConflictError) {
      status = 409;
      code = 'STORAGE_CONFLICT';
    } else if (err instanceof ScopeViolationError) {
      status = 403;
      code = 'SCOPE_VIOLATION';
    }

    response.status(status).json({
      statusCode: status,
      error: code,
      message: err.message,
    });
  }
}
```

HTTP error mapping belongs to the application. The storage package only provides the normalized storage errors.

## Testing

Every adapter should be tested against the same behavioral contract.

```typescript
import {
  describeStorageContract,
} from '@luvien/storage/testing';

import { MyCustomStorage } from './my-custom.storage.js';

describeStorageContract(
  'MyCustomStorage',
  {
    supportsPresignedUrls: true,
    build: () => new MyCustomStorage(),
  },
);
```

The contract covers:

```text
put
get
head
exists
delete
list
```

and, when supported:

```text
createUploadUrl
createDownloadUrl
```

Scope behavior should also be covered by adapter contract tests where applicable.

Unit tests must not require external infrastructure.

For integration testing against a real S3-compatible service, use a local S3-compatible server such as SeaweedFS or another supported provider.

## Scope

`@luvien/storage` intentionally does not provide:

* Image resizing or compression
* Video transcoding
* PDF generation
* Thumbnail generation
* OCR
* Virus scanning
* MIME-content inspection
* Multipart HTTP parsing
* Express or Multer integration
* File upload or download controllers
* Business authorization
* Tenant/outlet relationship validation
* Database file records or attachment entities
* CDN management
* Lifecycle policy abstraction
* Cross-provider transactions
* Distributed locking
* Job queues
* Automatic bucket creation
* Automatic lifecycle management

These concerns belong to the application, storage provider, or separate infrastructure packages.

## Boundary

The application owns business meaning.

`@luvien/storage` owns object persistence and provider adaptation.

The storage provider owns the underlying durability and storage mechanics.

```text
Application
    ├── business keys
    ├── scope population
    ├── authorization
    ├── HTTP layer
    └── domain/file records

@luvien/storage
    ├── logical-key validation
    ├── scope prefixing
    ├── storage contract
    ├── provider adaptation
    └── normalized storage errors

Provider
    ├── object durability
    ├── replication
    ├── provider-level checksums
    └── provider lifecycle behavior
```

Do not make `@luvien/storage` aware of business concepts.

Do not read `process.env` inside the library.

Compose `StorageModuleOptions` through the application's configuration pipeline and pass it into the module.

## Status

🚧 **Work in progress**

The API may change before the first stable release.

## License

PolyForm Shield 1.0.0
