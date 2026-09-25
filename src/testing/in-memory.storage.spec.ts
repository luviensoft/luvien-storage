import { InMemoryStorage } from './in-memory.storage.js';
import { describeStorageContract } from './contracts/storage.contract.js';

describeStorageContract('InMemoryStorage', {
  supportsPresignedUrls: true,
  build: () => new InMemoryStorage(),
});
