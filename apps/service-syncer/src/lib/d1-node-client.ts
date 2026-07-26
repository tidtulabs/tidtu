import Cloudflare from "cloudflare";
import { getMiniflareD1 } from "./miniflare-client";
import { logger } from "./logger";

export interface D1NodeResult<T = any> {
  results: T[];
  success: boolean;
  meta?: any;
}

export class D1NodeClient {
  private accountId: string;
  private databaseId: string;
  private apiToken?: string;
  private apiEmail?: string;
  private apiKey?: string;
  private client?: Cloudflare;

  constructor() {
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "";
    this.databaseId = process.env.CLOUDFLARE_DATABASE_ID || "8b869b74-4a7d-4804-ad82-c407e2edfeb0";
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN;
    this.apiEmail = process.env.CLOUDFLARE_EMAIL;
    this.apiKey = process.env.CLOUDFLARE_API_KEY;

    if (this.apiEmail && this.apiKey) {
      this.client = new Cloudflare({ apiEmail: this.apiEmail, apiKey: this.apiKey });
    } else if (this.apiToken) {
      this.client = new Cloudflare({ apiToken: this.apiToken });
    }
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<D1NodeResult<T>> {
    const isDevMode =
      process.env.NODE_ENV === "dev" || (!this.client && !this.apiToken && !this.apiKey);

    if (isDevMode) {
      logger.debug(`[D1] local query: ${sql.slice(0, 80)}...`);
      try {
        const mfD1 = await getMiniflareD1();
        const stmt = mfD1.prepare(sql).bind(...params);
        if (sql.trim().toUpperCase().startsWith("SELECT")) {
          const res = await stmt.all();
          return { results: res.results || [], success: true };
        }
        const res = await stmt.run();
        return { results: res.results || [], success: true, meta: res.meta };
      } catch (err: any) {
        logger.error(`[D1 Connection] Local Miniflare D1 error: ${err.message}`);
        throw err;
      }
    }

    logger.info(
      `[D1 Connection] Connected to REMOTE Cloudflare D1 Database (Account: ${this.accountId}, DB: ${this.databaseId})`,
    );

    if (this.client) {
      try {
        const response = await this.client.d1.database.query(this.databaseId, {
          account_id: this.accountId,
          sql,
          params,
        });

        const firstResult = Array.isArray(response) ? response[0] : response;
        return {
          results: (firstResult?.results as T[]) || [],
          success: firstResult?.success ?? true,
          meta: firstResult?.meta,
        };
      } catch (error: any) {
        console.error("[D1NodeClient] Query failed via SDK:", error);
        throw error;
      }
    }

    // Direct fetch fallback if SDK is not initialized
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}/query`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiToken) {
      headers["Authorization"] = `Bearer ${this.apiToken}`;
    } else if (this.apiEmail && this.apiKey) {
      headers["X-Auth-Email"] = this.apiEmail;
      headers["X-Auth-Key"] = this.apiKey;
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ sql, params }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`D1 REST API error: HTTP ${res.status} - ${errText}`);
    }

    const json = (await res.json()) as any;
    const resultObj = json.result?.[0] || {};
    return {
      results: resultObj.results || [],
      success: json.success,
      meta: resultObj.meta,
    };
  }
}

export const d1NodeClient = new D1NodeClient();
