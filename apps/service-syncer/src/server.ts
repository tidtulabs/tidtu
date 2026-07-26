import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { bearerAuth } from "hono/bearer-auth";
import dotenv from "dotenv";
import { resumePendingExtractions } from "./services/exam";
import scanRouter from "./routes/scan";
import { logger } from "./lib/logger";

dotenv.config();

const app = new Hono();
app.use("*", cors());

// Auth middleware: protect all /api/* routes with Bearer token
app.use("/api/*", (c, next) => {
  const token = process.env.SYNCER_API_TOKEN;
  if (!token) return next();
  return bearerAuth({ token })(c, next);
});

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "service-syncer",
    timestamp: new Date().toISOString(),
  });
});

app.route("/api/v1/pdaotao", scanRouter);

const port = Number(process.env.PORT) || 4010;
const nodeEnv = process.env.NODE_ENV || "production";
const r2Endpoint = process.env.R2_ENDPOINT || "https://<accountId>.r2.cloudflarestorage.com";
const d1DbId = process.env.CLOUDFLARE_DATABASE_ID || "8b869b74-4a7d-4804-ad82-c407e2edfeb0";

logger.info(`Starting service-syncer on port ${port} (ENV: ${nodeEnv})`);
if (nodeEnv === "dev") {
  logger.info(`D1 Storage Mode: LOCAL (Miniflare SQLite DB: ${d1DbId})`);
  logger.info(`R2 Storage Mode: LOCAL (Miniflare R2 Bucket: tidtu-files)`);
} else {
  logger.info("D1 Storage Mode: REMOTE Cloudflare D1");
  logger.info("R2 Storage Mode: REMOTE Cloudflare R2");
}
// Run auto recovery to pick up any unfinished background tasks
resumePendingExtractions();

serve({
  fetch: app.fetch,
  port,
});
