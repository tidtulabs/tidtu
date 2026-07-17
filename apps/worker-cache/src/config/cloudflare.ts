import Cloudflare from "cloudflare";
import { getKVNamespace } from "@lib/miniflare-kv";

interface KVResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface KV {
  put: (
    key: string,
    data: any,
    options?: {
      expirationTtl?: number;
    },
  ) => Promise<KVResponse>;
  get: (key: string) => Promise<any | null>;
  delete: (key: string) => Promise<KVResponse>;
}

let instance: KV | null = null;

async function createCloudflareKV(): Promise<KV | null> {
  const email = process.env["CLOUDFLARE_EMAIL"];
  const apiKey = process.env["CLOUDFLARE_API_KEY"];
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const namespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID;

  if (!email || !apiKey || !accountId || !namespaceId) return null;

  const client = new Cloudflare({ apiEmail: email, apiKey });

  return {
    put: async (key, data, options) => {
      try {
        await client.kv.namespaces.values.update(namespaceId, key, {
          account_id: accountId,
          metadata: JSON.stringify({ createdAt: new Date().toISOString() }),
          value: data,
          ...(options?.expirationTtl && {
            expiration_ttl: options.expirationTtl,
          }),
        });
        return { success: true, message: "Data stored successfully" };
      } catch (error: any) {
        return {
          success: false,
          message: `Error storing data: ${error.message}`,
        };
      }
    },
    get: async (key) => {
      try {
        const res = await client.kv.namespaces.values.get(namespaceId, key, {
          account_id: accountId,
        });
        if (!res) return null;
        const data = await res.text();
        return data;
      } catch (error: any) {
        if (error?.status === 404) return null;
        console.error("Error retrieving data:", error);
        return null;
      }
    },
    delete: async (key) => {
      try {
        await client.kv.namespaces.values.delete(namespaceId, key, {
          account_id: accountId,
        });
        return { success: true, message: "Data deleted successfully" };
      } catch (error: any) {
        return {
          success: false,
          message: `Error deleting data: ${error.message}`,
        };
      }
    },
  };
}

async function createMiniflareKV(): Promise<KV> {
  const mfKv = await getKVNamespace();
  return {
    put: async (key, data, options) => {
      try {
        await mfKv.put(key, data, {
          ...(options?.expirationTtl && {
            expirationTtl: options.expirationTtl,
          }),
        });
        return { success: true, message: "Data stored successfully" };
      } catch (error: any) {
        return {
          success: false,
          message: `Error storing data: ${error.message}`,
        };
      }
    },
    get: async (key) => {
      try {
        const value = await mfKv.get(key);
        return value ?? null;
      } catch (error) {
        console.error("Error retrieving data:", error);
        return null;
      }
    },
    delete: async (key) => {
      try {
        await mfKv.delete(key);
        return { success: true, message: "Data deleted successfully" };
      } catch (error: any) {
        return {
          success: false,
          message: `Error deleting data: ${error.message}`,
        };
      }
    },
  };
}

async function getKV(): Promise<KV> {
  if (instance) return instance;

  if (process.env.NODE_ENV === "dev") {
    instance = await createMiniflareKV();
  } else {
    const cfKv = await createCloudflareKV();
    if (!cfKv) {
      throw new Error(
        "Missing Cloudflare configuration (CLOUDFLARE_EMAIL, CLOUDFLARE_API_KEY, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_KV_NAMESPACE_ID)",
      );
    }
    instance = cfKv;
  }

  return instance;
}

export { getKV };
