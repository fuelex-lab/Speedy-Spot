import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import {
  decodeEncryptionKey,
  EncryptedFileTokenStore,
  FileTokenStore,
  InMemoryTokenStore
} from "../src/auth/tokenStore.js";

test("InMemoryTokenStore set/get/delete", async () => {
  const store = new InMemoryTokenStore();
  const token = { accessToken: "a", refreshToken: "b", expiresAt: Date.now() + 1000 };

  await store.set("u1", token);
  const found = await store.get("u1");
  assert.equal(found.accessToken, "a");

  await store.delete("u1");
  const missing = await store.get("u1");
  assert.equal(missing, null);
});

test("FileTokenStore persists token data", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "speedy-spot-test-"));
  const file = path.join(dir, "tokens.json");
  const storeA = new FileTokenStore(file);

  await storeA.set("u1", { accessToken: "x", refreshToken: "y", expiresAt: 123 });

  const storeB = new FileTokenStore(file);
  const found = await storeB.get("u1");
  assert.equal(found.accessToken, "x");

  await fs.rm(dir, { recursive: true, force: true });
});

test("EncryptedFileTokenStore persists encrypted payload", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "speedy-spot-test-"));
  const file = path.join(dir, "tokens.enc.json");
  const key = decodeEncryptionKey("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");

  const storeA = new EncryptedFileTokenStore(file, key);
  await storeA.set("u1", { accessToken: "secret_access", refreshToken: "secret_refresh", expiresAt: 123 });

  const raw = await fs.readFile(file, "utf-8");
  assert.equal(raw.includes("secret_access"), false);

  const storeB = new EncryptedFileTokenStore(file, key);
  const found = await storeB.get("u1");
  assert.equal(found.accessToken, "secret_access");

  await fs.rm(dir, { recursive: true, force: true });
});

test("EncryptedFileTokenStore fails with wrong key", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "speedy-spot-test-"));
  const file = path.join(dir, "tokens.enc.json");
  const keyA = decodeEncryptionKey("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
  const keyB = decodeEncryptionKey("abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789");

  const storeA = new EncryptedFileTokenStore(file, keyA);
  await storeA.set("u1", { accessToken: "secret_access", refreshToken: "secret_refresh", expiresAt: 123 });

  const storeB = new EncryptedFileTokenStore(file, keyB);
  await assert.rejects(() => storeB.get("u1"));

  await fs.rm(dir, { recursive: true, force: true });
});

test("decodeEncryptionKey supports hex and rejects invalid values", () => {
  const hex = decodeEncryptionKey("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
  assert.equal(hex.length, 32);

  assert.throws(() => decodeEncryptionKey("short_key"), /32-byte base64 or 64-char hex/);
});
