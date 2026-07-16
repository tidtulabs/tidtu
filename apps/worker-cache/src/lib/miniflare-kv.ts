import { Miniflare } from "miniflare";
import { resolve } from "path";

let mf: Miniflare | null = null;
let kv: any = null;

const PERSIST_DIR = resolve(__dirname, "../../../worker-pdaotao/.wrangler/state/v3/kv");
const KV_NAMESPACE_ID = process.env.CLOUDFLARE_KV_NAMESPACE_ID || "e005913ce4b04361815155aed5a3e2dc";

export async function getKVNamespace(): Promise<any> {
  if (kv) return kv;

  if (!mf) {
    mf = new Miniflare({
      modules: [
        {
          type: "ESModule",
          path: "mf-bootstrap.mjs",
          contents:
            'export default { fetch() { return new Response("ok"); } }',
        },
      ],
      kvNamespaces: { "CACHE_TIDTU": KV_NAMESPACE_ID },
      kvPersist: PERSIST_DIR,
    });
  }

  kv = await mf.getKVNamespace("CACHE_TIDTU");
  return kv;
}

export async function dispose(): Promise<void> {
  if (mf) {
    await mf.dispose();
    mf = null;
    kv = null;
  }
}
