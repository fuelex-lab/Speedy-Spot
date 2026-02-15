import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ENC_VERSION = 1;
const ENC_ALGO = "aes-256-gcm";
const IV_BYTES = 12;

export class InMemoryTokenStore {
  constructor() {
    this.data = new Map();
  }

  async get(userId) {
    return this.data.get(userId) ?? null;
  }

  async set(userId, token) {
    this.data.set(userId, token);
  }

  async delete(userId) {
    this.data.delete(userId);
  }
}

export class FileTokenStore {
  constructor(filePath) {
    this.filePath = path.resolve(filePath);
    this.cache = null;
  }

  async get(userId) {
    const all = await this.#readAll();
    return all[userId] ?? null;
  }

  async set(userId, token) {
    const all = await this.#readAll();
    all[userId] = token;
    await this.#writeAll(all);
  }

  async delete(userId) {
    const all = await this.#readAll();
    delete all[userId];
    await this.#writeAll(all);
  }

  async #readAll() {
    if (this.cache) {
      return this.cache;
    }

    try {
      const raw = await fs.readFile(this.filePath, "utf-8");
      this.cache = JSON.parse(raw);
      return this.cache;
    } catch (error) {
      if (error.code === "ENOENT") {
        this.cache = {};
        return this.cache;
      }
      throw error;
    }
  }

  async #writeAll(data) {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    const tmpPath = `${this.filePath}.tmp`;
    await fs.writeFile(tmpPath, JSON.stringify(data, null, 2));
    await fs.rename(tmpPath, this.filePath);
    this.cache = data;
  }
}

export class EncryptedFileTokenStore {
  constructor(filePath, encryptionKey) {
    this.filePath = path.resolve(filePath);
    this.encryptionKey = encryptionKey;
    this.cache = null;
  }

  async get(userId) {
    const all = await this.#readAll();
    return all[userId] ?? null;
  }

  async set(userId, token) {
    const all = await this.#readAll();
    all[userId] = token;
    await this.#writeAll(all);
  }

  async delete(userId) {
    const all = await this.#readAll();
    delete all[userId];
    await this.#writeAll(all);
  }

  async #readAll() {
    if (this.cache) {
      return this.cache;
    }

    try {
      const raw = await fs.readFile(this.filePath, "utf-8");
      const payload = JSON.parse(raw);
      this.cache = decryptPayload(payload, this.encryptionKey);
      return this.cache;
    } catch (error) {
      if (error.code === "ENOENT") {
        this.cache = {};
        return this.cache;
      }
      throw error;
    }
  }

  async #writeAll(data) {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    const payload = encryptPayload(data, this.encryptionKey);
    const tmpPath = `${this.filePath}.tmp`;
    await fs.writeFile(tmpPath, JSON.stringify(payload, null, 2));
    await fs.rename(tmpPath, this.filePath);
    this.cache = data;
  }
}

function encryptPayload(data, key) {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ENC_ALGO, key, iv);
  const plaintext = Buffer.from(JSON.stringify(data), "utf-8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    v: ENC_VERSION,
    alg: ENC_ALGO,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: ciphertext.toString("base64")
  };
}

function decryptPayload(payload, key) {
  if (payload?.v !== ENC_VERSION || payload?.alg !== ENC_ALGO) {
    throw new Error("Unsupported encrypted token store payload format");
  }

  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const data = Buffer.from(payload.data, "base64");

  const decipher = crypto.createDecipheriv(ENC_ALGO, key, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(plaintext.toString("utf-8"));
}

function isHexKey(value) {
  return /^[a-fA-F0-9]{64}$/.test(value);
}

export function decodeEncryptionKey(rawKey) {
  if (!rawKey) {
    throw new Error("TOKEN_STORE_ENCRYPTION_KEY is required for encrypted-file token store");
  }

  if (isHexKey(rawKey)) {
    return Buffer.from(rawKey, "hex");
  }

  const key = Buffer.from(rawKey, "base64");
  if (key.length !== 32) {
    throw new Error("TOKEN_STORE_ENCRYPTION_KEY must be 32-byte base64 or 64-char hex");
  }

  return key;
}
