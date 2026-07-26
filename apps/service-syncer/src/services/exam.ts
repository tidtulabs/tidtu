import crypto from "crypto";
import { ScrapedExam } from "../types";
import { downloadFile } from "../helpers/download";
import { extractText } from "../helpers/extract-text";
import { d1NodeClient } from "../lib/d1-node-client";
import { uploadToR2Node, getFromR2Node, deleteFromR2Node } from "../lib/r2-node-client";
import { logger } from "../lib/logger";
import {
  insertFile,
  insertExtractedText,
  insertExamMetadata,
  updateFileStatus,
  getFileHash,
  getFileR2Key,
  getUploadedFiles,
  getFileId,
} from "./db";

function md5(buffer: ArrayBuffer | Buffer): string {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(new Uint8Array(buffer));
  return crypto.createHash("md5").update(buf).digest("hex");
}

export async function step1_downloadAndUploadR2(msg: ScrapedExam): Promise<{
  fileId: number;
  r2Key: string;
  fileType: string;
  buffer: Buffer;
} | null> {
  const baseUrl = process.env.PDAOTAO_BASE_URL || "https://pdaotao.duytan.edu.vn";

  logger.debug("Downloading exam file", { examId: msg.examId });
  await updateFileStatus(d1NodeClient, msg.examId, "downloading");

  const { buffer, fileType, fileSize } = await downloadFile(baseUrl, msg.fileUrl);
  const fileHash = md5(buffer);
  const existingHash = await getFileHash(d1NodeClient, msg.examId);

  if (existingHash && existingHash === fileHash) {
    logger.info("Exam content unchanged, skipping upload", { examId: msg.examId });
    const fileId = await getFileId(d1NodeClient, msg.examId);
    if (fileId) {
      await insertExamMetadata(d1NodeClient, fileId, msg);
    }
    await updateFileStatus(d1NodeClient, msg.examId, "done");
    return null;
  }

  const r2FileName = `${msg.examId}.${fileType}`;
  const r2Key = `exams/${msg.examId}/${r2FileName}`;

  const contentTypeMap: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xls: "application/vnd.ms-excel",
  };
  const contentType = contentTypeMap[fileType] || "application/octet-stream";

  const nodeBuf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(new Uint8Array(buffer));

  // Get existing R2 key before uploading new file to check if we need to clean up the old file
  const oldR2Key = await getFileR2Key(d1NodeClient, msg.examId);

  await uploadToR2Node(r2Key, nodeBuf, contentType);
  logger.debug("Uploaded exam to R2", { r2Key, contentType });

  // Clean up the old file if the R2 key has changed (e.g. extension changed from .doc to .pdf)
  if (oldR2Key && oldR2Key !== r2Key) {
    try {
      await deleteFromR2Node(oldR2Key);
      logger.info("Deleted old exam file from R2 due to updates", { examId: msg.examId, oldR2Key });
    } catch (delErr) {
      logger.error("Failed to delete old R2 object", {
        examId: msg.examId,
        oldR2Key,
        error: delErr,
      });
    }
  }

  const fileId = await insertFile(d1NodeClient, msg, fileType, fileSize, r2Key, fileHash);
  await insertExamMetadata(d1NodeClient, fileId, msg);

  await updateFileStatus(d1NodeClient, msg.examId, "uploaded");

  return { fileId, r2Key, fileType, buffer: nodeBuf };
}

export async function step2_extractTextAndIndex(
  fileId: number,
  examId: string,
  buffer: Buffer,
  fileType: string,
  fileName?: string,
): Promise<void> {
  // NOTE: Text extraction is currently bypassed. Files are directly marked as done.
  await updateFileStatus(d1NodeClient, examId, "done");
  logger.info(`Processed exam done: ${fileName} (${examId})`);
}

export async function processExamTask(msg: ScrapedExam): Promise<void> {
  const step1Result = await step1_downloadAndUploadR2(msg);
  if (!step1Result) return;

  await step2_extractTextAndIndex(
    step1Result.fileId,
    msg.examId,
    step1Result.buffer,
    step1Result.fileType,
    msg.fileName,
  );
}

export async function resumePendingExtractions(): Promise<void> {
  logger.info("Checking database for unfinished tasks");
  try {
    const uploadedFiles = await getUploadedFiles(d1NodeClient);

    if (uploadedFiles && uploadedFiles.length > 0) {
      logger.info("Found files awaiting text extraction, resuming processing", {
        count: uploadedFiles.length,
      });
      for (const file of uploadedFiles) {
        try {
          // NOTE: Text extraction is currently bypassed. Directly mark files as done.
          await updateFileStatus(d1NodeClient, file.exam_id, "done");
          logger.info(`Processed exam done: ${file.file_name} (${file.exam_id})`);
        } catch (err: any) {
          logger.error("Failed resuming processing for exam", { examId: file.exam_id, error: err });
          await updateFileStatus(d1NodeClient, file.exam_id, "failed", err.message);
        }
      }
    } else {
      logger.info("No pending text extraction tasks found");
    }
  } catch (err: any) {
    logger.error("Recovery check failed", { error: err });
  }
}
