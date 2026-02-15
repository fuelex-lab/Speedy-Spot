import {
  decodeEncryptionKey,
  EncryptedFileTokenStore,
  FileTokenStore,
  InMemoryTokenStore
} from "./tokenStore.js";

export function createTokenStore(config) {
  if (config.tokenStoreProvider === "memory") {
    return new InMemoryTokenStore();
  }

  if (config.tokenStoreProvider === "file") {
    return new FileTokenStore(config.tokenStoreFile);
  }

  if (config.tokenStoreProvider === "encrypted-file") {
    const key = decodeEncryptionKey(config.tokenStoreEncryptionKey);
    return new EncryptedFileTokenStore(config.tokenStoreFile, key);
  }

  throw new Error(`Unsupported TOKEN_STORE_PROVIDER: ${config.tokenStoreProvider}`);
}
