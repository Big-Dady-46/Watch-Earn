import fs from 'fs';
import path from 'path';

/**
 * Universal Server-Side Cloud Storage Engine
 * Supports:
 * 1. Vercel KV / Upstash Redis REST API (100% free serverless key-value store)
 * 2. Custom environment variables or runtime cloud connection
 * 3. Local filesystem fallback for dev server (data/*.json)
 */

interface UpstashConfig {
  url?: string;
  token?: string;
}

function getUpstashConfig(): UpstashConfig {
  const url = 
    process.env.KV_REST_API_URL || 
    process.env.UPSTASH_REDIS_REST_URL || 
    process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL;
  const token = 
    process.env.KV_REST_API_TOKEN || 
    process.env.UPSTASH_REDIS_REST_TOKEN || 
    process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN;

  return { url, token };
}

// In-memory server cache for ultra-low latency & resilient fallback
const memoryCache = new Map<string, any>();

// Local file storage path for local development
const DATA_DIR = path.join(process.cwd(), '.data');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {}
}

function readLocalFile<T>(key: string, fallback: T): T {
  try {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, `${key}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch {}
  return fallback;
}

function writeLocalFile<T>(key: string, data: T): void {
  try {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch {}
}

/**
 * Read data from Cloud Database with local fallback
 */
export async function getCloudData<T>(key: string, defaultValue: T): Promise<T> {
  const { url, token } = getUpstashConfig();

  // If Upstash / Vercel KV is configured:
  if (url && token) {
    try {
      const endpoint = `${url.replace(/\/$/, '')}/get/${encodeURIComponent(key)}`;
      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const json = await res.json();
        if (json.result !== null && json.result !== undefined) {
          // If result is stringified JSON, parse it
          if (typeof json.result === 'string') {
            try {
              const parsed = JSON.parse(json.result);
              memoryCache.set(key, parsed);
              return parsed;
            } catch {
              memoryCache.set(key, json.result);
              return json.result as unknown as T;
            }
          }
          memoryCache.set(key, json.result);
          return json.result;
        }
      }
    } catch (err) {
      console.warn(`[CloudStorage] Error fetching ${key} from Upstash:`, err);
    }
  }

  // Check memory cache first
  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }

  // Fallback to local file in development
  const localVal = readLocalFile(key, defaultValue);
  memoryCache.set(key, localVal);
  return localVal;
}

/**
 * Write data to Cloud Database with local fallback
 */
export async function setCloudData<T>(key: string, data: T): Promise<boolean> {
  memoryCache.set(key, data);
  writeLocalFile(key, data);

  const { url, token } = getUpstashConfig();

  if (url && token) {
    try {
      const endpoint = `${url.replace(/\/$/, '')}/set/${encodeURIComponent(key)}`;
      const payload = typeof data === 'string' ? data : JSON.stringify(data);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      });

      return res.ok;
    } catch (err) {
      console.warn(`[CloudStorage] Error saving ${key} to Upstash:`, err);
      return false;
    }
  }

  return true;
}

/**
 * Check cloud connectivity status
 */
export async function checkCloudStatus(): Promise<{ connected: boolean; provider: 'upstash' | 'local_fallback' }> {
  const { url, token } = getUpstashConfig();
  if (url && token) {
    try {
      const res = await fetch(`${url.replace(/\/$/, '')}/ping`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.ok) {
        return { connected: true, provider: 'upstash' };
      }
    } catch {}
  }
  return { connected: true, provider: 'local_fallback' };
}
