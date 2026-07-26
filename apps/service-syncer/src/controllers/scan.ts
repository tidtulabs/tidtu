import { Context } from "hono";
import { fetchPageExams, filterNewOrUpdated } from "../services/scan";
import { ScrapedExam } from "../types";
import { processExamTask } from "../services/exam";
import { updateScanStatus, getAllStoredExams, deleteExamRecord } from "../services/db";
import { deleteFromR2Node } from "../lib/r2-node-client";
import { getKV } from "../lib/cloudflare-kv";
import { d1NodeClient } from "../lib/d1-node-client";
import { logger } from "../lib/logger";

let activeScanAbortController: AbortController | null = null;

async function waitForCacheReady(KV: any): Promise<boolean> {
  const timeoutMs = 10000; // 10 seconds
  const pollIntervalMs = 2000; // poll every 2 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const statusRaw = await KV.get("cacheStatus");
    if (!statusRaw) return false;

    try {
      const status = JSON.parse(statusRaw);
      if (status.status === "ready") {
        return true;
      }
      if (status.status === "failed") {
        return false;
      }
      if (status.status === "updating") {
        const cacheMaxDurationMs = 300000; // 5 minutes threshold like cache-service
        if (status.startedAt && Date.now() - status.startedAt > cacheMaxDurationMs) {
          return false;
        }
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      } else {
        return false;
      }
    } catch {
      return false;
    }
  }
  return false;
}

async function getExistingExamsBatch(
  db: any,
  examIds: string[],
): Promise<Map<string, string | null>> {
  const existing = new Map<string, string | null>();
  if (examIds.length === 0) return existing;

  const placeholders = examIds.map(() => "?").join(",");
  const sql = `SELECT f.exam_id, m.upload_date FROM files f LEFT JOIN exam_metadata m ON f.id = m.file_id WHERE f.exam_id IN (${placeholders}) AND f.file_hash IS NOT NULL`;

  try {
    let results: { exam_id: string; upload_date: string | null }[] = [];
    if (db && typeof db.prepare === "function") {
      const res = await db
        .prepare(sql)
        .bind(...examIds)
        .all();
      results = res.results || [];
    } else if (db && typeof db.query === "function") {
      const res = await db.query(sql, examIds);
      results = res.results || [];
    }
    for (const r of results) {
      existing.set(r.exam_id, r.upload_date);
    }
  } catch (err) {
    logger.error("Failed to query batch of exam records", { error: err });
  }
  return existing;
}

export const scanExams = async (c: Context) => {
  const db = c.env?.DB || d1NodeClient;

  if (activeScanAbortController) {
    logger.info("New scan requested, aborting previous active background scan");
    activeScanAbortController.abort();
  }
  activeScanAbortController = new AbortController();
  const signal = activeScanAbortController.signal;

  try {
    const baseUrl = process.env.PDAOTAO_BASE_URL || "https://pdaotao.duytan.edu.vn";
    const isDeepScan = c.req.query("deep") === "true";
    const pageLimit = Infinity;

    await updateScanStatus(db, "updating");

    const allNewOrUpdated: ScrapedExam[] = [];
    const activeExamIds = new Set<string>();
    let reachedEnd = false;
    let isFromCache = false;

    try {
      const KV = await getKV();

      logger.info("Checking cacheStatus before reading exam list...");
      const cacheReady = await waitForCacheReady(KV);

      if (cacheReady) {
        const [freqRaw, totalRaw] = await Promise.all([
          KV.get("examList:frequency"),
          KV.get("examList:total"),
        ]);

        let combinedData: any[] = [];
        if (freqRaw) {
          const freqList = JSON.parse(freqRaw);
          if (freqList && Array.isArray(freqList.data)) {
            combinedData.push(...freqList.data);
          }
        }
        if (totalRaw) {
          const totalList = JSON.parse(totalRaw);
          if (totalList && Array.isArray(totalList.data)) {
            combinedData.push(...totalList.data);
          }
        }

        if (combinedData.length > 0) {
          const parsedItems = combinedData
            .map((item: any) => {
              const sanitizedTitle = item.examTitle
                .replace(/[/\\?%*:|"<>]/g, "-")
                .replace(/\s+/g, "_");
              return {
                examId: item.examId,
                examTitle: item.examTitle,
                fileUrl: item.examDetailsUrl,
                fileName: sanitizedTitle,
                uploadDate: item.uploadDate,
                pagination: item.pagination || 1,
                row: item.row || 1,
              };
            })
            .filter((item: any) => item.examId && item.examId !== "");

          for (const item of parsedItems) {
            activeExamIds.add(item.examId);
          }

          if (isDeepScan) {
            const newOrUpdated = await filterNewOrUpdated(db, parsedItems);
            allNewOrUpdated.push(...newOrUpdated);
          } else {
            const batchSize = 50;
            let shouldStop = false;

            for (let i = 0; i < parsedItems.length; i += batchSize) {
              if (shouldStop) break;

              const batchItems = parsedItems.slice(i, i + batchSize);
              const batchIds = batchItems.map((item) => item.examId);

              const existingMap = await getExistingExamsBatch(db, batchIds);

              for (const item of batchItems) {
                const existingDate = existingMap.get(item.examId);
                const isNewOrUpdated =
                  existingDate === undefined || item.uploadDate !== existingDate;

                if (isNewOrUpdated) {
                  allNewOrUpdated.push(item);
                } else {
                  logger.info(
                    "Found already indexed exam, stopping early in quick-scan mode (cache)",
                    { examId: item.examId },
                  );
                  shouldStop = true;
                  break;
                }
              }
            }
          }

          reachedEnd = isDeepScan;
          isFromCache = true;
          logger.info("Using cached exam list from KV", {
            count: parsedItems.length,
            foundNewCount: allNewOrUpdated.length,
          });
        }
      } else {
        logger.info("Cache is not ready or failed, proceeding with direct website scraping");
      }
    } catch (kvErr: any) {
      logger.warn("Failed to retrieve exam list from KV, falling back to direct website scraping", {
        error: kvErr,
      });
    }

    if (!isFromCache) {
      let pageUrl: string | null = null;
      let pageNum = 1;

      while (pageNum <= pageLimit) {
        if (signal.aborted) {
          logger.info("Scraping aborted by a newer request");
          return c.json({ success: false, message: "Scan aborted by a newer request" }, 499 as any);
        }
        const { items, nextHref } = await fetchPageExams(baseUrl, pageUrl, pageNum);

        if (items.length === 0) {
          reachedEnd = true;
          break;
        }

        for (const item of items) {
          activeExamIds.add(item.examId);
        }

        const newOrUpdatedOnPage = await filterNewOrUpdated(db, items);

        allNewOrUpdated.push(...newOrUpdatedOnPage);

        if (!isDeepScan && newOrUpdatedOnPage.length < items.length) {
          logger.info(
            "Found already indexed exams on this page, stopping early in quick-scan mode",
            { pageNum },
          );
          break;
        }

        if (!nextHref) {
          reachedEnd = true;
          break;
        }
        pageUrl = nextHref;
        pageNum++;
      }
    }

    const toProcess = allNewOrUpdated;

    if (toProcess.length === 0) {
      if (!signal.aborted) {
        await updateScanStatus(db, "ready");
      }
      return c.json({
        success: true,
        message: "No new or updated files found",
        foundCount: 0,
      });
    }

    (async () => {
      let processedCount = 0;
      for (const item of toProcess) {
        if (signal.aborted) {
          logger.info("Background scan aborted by a newer request");
          return;
        }
        try {
          await processExamTask(item);
          processedCount++;
          // Force garbage collection if available to maximize free RAM
          if (global.gc) {
            global.gc();
          }
        } catch (err: any) {
          logger.error("Error processing background exam task", {
            examId: item.examId,
            error: err,
          });
        }
      }
      if (!signal.aborted) {
        // Cleanup deleted exams only after all new/updated exams are successfully processed
        if (reachedEnd) {
          try {
            logger.info("Reached the end of the website. Checking for deleted historical exams...");
            const storedExams = await getAllStoredExams(db);
            const deletedExams = storedExams.filter((file) => !activeExamIds.has(file.exam_id));

            if (deletedExams.length > 0) {
              logger.info("Found deleted exams on the website, cleaning up local records", {
                count: deletedExams.length,
              });
              for (const file of deletedExams) {
                if (file.r2_key) {
                  try {
                    await deleteFromR2Node(file.r2_key);
                    logger.info("Deleted orphaned exam file from R2", {
                      examId: file.exam_id,
                      r2Key: file.r2_key,
                    });
                  } catch (r2Err) {
                    logger.error("Failed to delete orphaned exam file from R2", {
                      examId: file.exam_id,
                      r2Key: file.r2_key,
                      error: r2Err,
                    });
                  }
                }
                await deleteExamRecord(db, file.id);
                logger.info(
                  `Deleted exam record from database: ${file.file_name} (${file.exam_id})`,
                );
              }
              logger.info("Cleanup of deleted exams completed successfully", {
                count: deletedExams.length,
              });
            } else {
              logger.info("No deleted exams found. Database is fully in sync with the website.");
            }
          } catch (cleanupErr) {
            logger.error("Failed to execute deleted exams cleanup job", { error: cleanupErr });
          }
        }

        await updateScanStatus(db, "ready");
        logger.info("Finished processing background tasks", {
          processedCount,
          totalCount: toProcess.length,
        });
      }
    })().catch(async (bgErr) => {
      logger.error("[scan-bg] Critical error in background process:", bgErr);
      if (!signal.aborted) {
        await updateScanStatus(
          db,
          "failed",
          bgErr.message || "Critical error in background process",
        );
      }
    });

    return c.json({
      success: true,
      message: `Scanning initiated. Processing ${toProcess.length} new/updated files in the background sequentially.`,
      foundCount: toProcess.length,
    });
  } catch (err: any) {
    if (!signal.aborted) {
      await updateScanStatus(db, "failed", err.message);
    }
    logger.error("Scan controller execution failed", { error: err });
    return c.json({ success: false, message: err.message }, 500);
  }
};
