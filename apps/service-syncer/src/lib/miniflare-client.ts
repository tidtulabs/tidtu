import { Miniflare } from "miniflare";
import { resolve } from "path";

let mf: Miniflare | null = null;
let d1Instance: any = null;
let r2Instance: any = null;

const D1_PERSIST_DIR = resolve(__dirname, "../../../worker-pdaotao/.wrangler/state/v3/d1");
const D1_DATABASE_ID = process.env.CLOUDFLARE_DATABASE_ID || "8b869b74-4a7d-4804-ad82-c407e2edfeb0";

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "tidtu-files";
const R2_PERSIST_DIR = resolve(__dirname, "../../../worker-pdaotao/.wrangler/state/v3/r2");

export async function getMiniflareInstance(): Promise<Miniflare> {
  if (!mf) {
    mf = new Miniflare({
      modules: [
        {
          type: "ESModule",
          path: "mf-bootstrap.mjs",
          contents: 'export default { fetch() { return new Response("ok"); } }',
        },
      ],
      d1Databases: {
        DB: D1_DATABASE_ID,
        [D1_DATABASE_ID]: D1_DATABASE_ID,
      },
      d1Persist: D1_PERSIST_DIR,
      r2Buckets: { TIDTU_FILES: R2_BUCKET_NAME },
      r2Persist: R2_PERSIST_DIR,
    });
  }
  return mf;
}

export async function getMiniflareD1(): Promise<any> {
  if (d1Instance) return d1Instance;
  const miniflare = await getMiniflareInstance();
  d1Instance = await miniflare.getD1Database("DB");
  return d1Instance;
}

export async function getMiniflareR2(): Promise<any> {
  if (r2Instance) return r2Instance;
  const miniflare = await getMiniflareInstance();
  r2Instance = await miniflare.getR2Bucket("TIDTU_FILES");
  return r2Instance;
}

export async function disposeMiniflare(): Promise<void> {
  if (mf) {
    await mf.dispose();
    mf = null;
    d1Instance = null;
    r2Instance = null;
  }
}
