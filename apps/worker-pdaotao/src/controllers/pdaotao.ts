import * as response from "utils/response";
import * as services from "services/pdaotao";
import { Context } from "hono";
import { BASE_URL } from "utils/base-url";

function getContentType(ext: string): string {
  const map: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xls: "application/vnd.ms-excel",
  };
  return map[ext] || "application/octet-stream";
}

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms)),
  ]);
};

export const getExamList = async (c: Context) => {
  try {
    const data = await services.fetchExamList(c);
    if (!data) {
      return response.error(c, "Get exam list failed");
    }
    return response.success(c, data?.data, data.meta);
  } catch (err: any) {
    if (err.errorType === "TIMEOUT") {
      return response.timeout(c, err.message);
    }
    return response.serverError(c, err.message);
  }
};

export const fetchExamDownloadLink = async (c: Context) => {
  const examId = c.req.param("examId");

  // Input validation: ensure examId is a clean positive integer
  if (!examId || !/^\d+$/.test(examId)) {
    return response.badRequest(c, "Mã đề thi không hợp lệ");
  }

  const PDAOTAO_STATUS_KEY = "pdaotao:server:status";

  let isSchoolUp = false;

  try {
    // 1. Read global health status of the school's server from KV
    let globalStatus = await c.env.CACHE_TIDTU.get(PDAOTAO_STATUS_KEY);

    // 2. If status cache is missing/expired, perform a quick HEAD request on the school homepage
    if (!globalStatus) {
      try {
        const pingRes = await fetch(BASE_URL, {
          method: "HEAD",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          signal: AbortSignal.timeout(5000),
        });
        if (pingRes.ok) {
          globalStatus = "up";
          // Cache UP status for 5 minutes (300 seconds)
          await c.env.CACHE_TIDTU.put(PDAOTAO_STATUS_KEY, "up", { expirationTtl: 300 });
        } else {
          globalStatus = "down";
          console.warn(
            `[fetchExamDownloadLink] School homepage health check returned non-2xx status: ${pingRes.status}. Marking server as DOWN.`,
          );
          // Cache DOWN status for 2 minutes (120 seconds)
          await c.env.CACHE_TIDTU.put(PDAOTAO_STATUS_KEY, "down", { expirationTtl: 120 });
        }
      } catch (pingErr: any) {
        globalStatus = "down";
        console.warn(
          `[fetchExamDownloadLink] School homepage health check failed with error: ${pingErr.message}. Marking server as DOWN.`,
        );
        await c.env.CACHE_TIDTU.put(PDAOTAO_STATUS_KEY, "down", { expirationTtl: 120 });
      }
    }

    isSchoolUp = globalStatus === "up";
  } catch (kvErr) {
    // Default to true on KV error so we attempt resolve
    isSchoolUp = true;
  }

  // 3. If school server is confirmed up, attempt download link resolution
  if (isSchoolUp) {
    try {
      const url = await withTimeout(services.resolveExamDownloadLink(c), 10000);
      if (url) {
        return response.success(c, {
          url: `${BASE_URL}/${url}`,
          fallback: false,
        });
      }
    } catch (err: any) {
      console.warn(
        `[fetchExamDownloadLink] Pdaotao link resolve failed for exam ${examId}: ${err.message}. Switching to R2 fallback...`,
      );
      // Mark global school server as down for 2 minutes on general resolve/connection errors
      await c.env.CACHE_TIDTU.put(PDAOTAO_STATUS_KEY, "down", { expirationTtl: 120 });
    }
  } else {
    console.warn(
      `[fetchExamDownloadLink] School server is down (Cached status). Using R2 fallback...`,
    );
  }

  // Fallback: Query D1 database to get the file name and type metadata
  let fileName = "";
  let fileType = "";
  let r2Key = "";
  try {
    const db = (c.env as any).DB;
    if (db) {
      const res = await db
        .prepare("SELECT file_name, file_type, r2_key FROM files WHERE exam_id = ?")
        .bind(examId)
        .first();
      if (res) {
        fileName = res.file_name || "";
        fileType = res.file_type || "";
        r2Key = res.r2_key || "";
      }
    }
  } catch (dbErr: any) {
    console.warn(`[fetchExamDownloadLink] Could not query D1: ${dbErr.message}`);
  }

  // 2. Stream file directly from R2 binding (fallback)
  const r2 = (c.env as any).TIDTU_FILES;
  if (r2 && r2Key) {
    try {
      const object = await r2.get(r2Key);
      if (object) {
        const ext = fileType || "pdf";
        const baseName = fileName ? fileName.replace(/\.[^/.]+$/, "") : examId;
        const downloadFileName = `${baseName}.${ext}`;
        const encodedFileName = encodeURIComponent(downloadFileName);
        const r2ContentType = object.httpMetadata?.contentType || getContentType(ext);

        return c.body(object.body, 200, {
          "Content-Type": r2ContentType,
          "Content-Disposition": `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
          "Content-Length": String(object.size),
          "Cache-Control": "public, max-age=31536000",
        });
      }
    } catch (r2Err: any) {
      console.error(`[fetchExamDownloadLink] R2 fallback failed: ${r2Err.message}`);
    }
  }

  return response.notFound(c, "Exam file not found");
};

export const checkExamListUpdate = async (c: Context) => {
  try {
    const raw = await c.env.CACHE_TIDTU.get("cacheStatus");
    const status = raw ? JSON.parse(raw) : null;
    const now = Date.now();

    let resolvedStatus = status?.status || null;
    if (status?.status === "ready" && status?.lastSuccessAt && now - status.lastSuccessAt < 10000) {
      resolvedStatus = "updating";
    }

    return response.success(c, {
      isUpdated: resolvedStatus === "ready",
      status: resolvedStatus,
      startedAt: status?.startedAt || null,
      elapsed: status?.startedAt ? now - status.startedAt : 0,
    });
  } catch {
    return response.success(c, { isUpdated: true, status: "ready", startedAt: null, elapsed: 0 });
  }
};
