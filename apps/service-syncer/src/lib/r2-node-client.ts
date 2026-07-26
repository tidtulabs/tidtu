import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { logger } from "./logger";

export function getR2NodeClient() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "";
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
  const endpoint = process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;

  if (!accessKeyId || !secretAccessKey || !accountId) {
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export async function uploadToR2Node(
  key: string,
  buffer: ArrayBuffer | Buffer,
  contentType: string,
): Promise<string> {
  const nodeBuf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const isDevMode =
    process.env.NODE_ENV === "dev" ||
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY;

  if (isDevMode) {
    logger.debug(`[R2 Storage] Connected to LOCAL R2 Storage via Miniflare: ${key}`);
    const { getMiniflareR2 } = require("./miniflare-client");
    const mfR2 = await getMiniflareR2();
    await mfR2.put(key, nodeBuf, {
      httpMetadata: { contentType },
    });
    return key;
  }

  const client = getR2NodeClient();
  if (!client) {
    throw new Error("R2 client not initialized. Check Cloudflare credentials in .env");
  }

  const bucketName = process.env.R2_BUCKET_NAME || "tidtu-files";
  const endpoint = process.env.R2_ENDPOINT || "";
  logger.debug(
    `[R2 Storage] Uploading object to REMOTE Cloudflare R2 (${bucketName} @ ${endpoint}): ${key}`,
  );

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: nodeBuf,
    ContentType: contentType,
  });

  await client.send(command);
  return key;
}

export async function getFromR2Node(key: string): Promise<Buffer | null> {
  const isDevMode =
    process.env.NODE_ENV === "dev" ||
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY;

  if (isDevMode) {
    logger.debug(`[R2 Storage] Fetching object from LOCAL R2 Storage via Miniflare: ${key}`);
    try {
      const { getMiniflareR2 } = require("./miniflare-client");
      const mfR2 = await getMiniflareR2();
      const object = await mfR2.get(key);
      if (object) {
        const arrayBuf = await object.arrayBuffer();
        return Buffer.from(arrayBuf);
      }
      logger.warn(`[R2 Storage] Object not found in LOCAL Miniflare R2: ${key}`);
      return null;
    } catch (err: any) {
      logger.error(`[R2 Storage] Local Miniflare R2 fetch error: ${err.message}`);
      return null;
    }
  }

  const client = getR2NodeClient();
  if (!client) return null;

  const bucketName = process.env.R2_BUCKET_NAME || "tidtu-files";
  const endpoint = process.env.R2_ENDPOINT || "";
  logger.debug(
    `[R2 Storage] Fetching object from REMOTE Cloudflare R2 (${bucketName} @ ${endpoint}): ${key}`,
  );
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    const response = await client.send(command);
    if (!response.Body) return null;

    const byteArray = await response.Body.transformToByteArray();
    return Buffer.from(byteArray);
  } catch (err: any) {
    logger.error(`[R2 Storage] Failed to get remote object ${key}: ${err.message}`);
    return null;
  }
}

export async function deleteFromR2Node(key: string): Promise<void> {
  const isDevMode =
    process.env.NODE_ENV === "dev" ||
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY;

  if (isDevMode) {
    logger.debug(`[R2 Storage] Deleting object from LOCAL R2 Storage via Miniflare: ${key}`);
    try {
      const { getMiniflareR2 } = require("./miniflare-client");
      const mfR2 = await getMiniflareR2();
      await mfR2.delete(key);
    } catch (err: any) {
      logger.error(`[R2 Storage] Local Miniflare R2 delete error: ${err.message}`);
    }
    return;
  }

  const client = getR2NodeClient();
  if (!client) return;

  const bucketName = process.env.R2_BUCKET_NAME || "tidtu-files";
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    await client.send(command);
    logger.debug(`[R2 Storage] Deleted object from REMOTE Cloudflare R2: ${key}`);
  } catch (err: any) {
    logger.error(`[R2 Storage] Failed to delete remote object ${key}: ${err.message}`);
  }
}
