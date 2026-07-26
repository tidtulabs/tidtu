import { ScrapedExam, FileType, FileStatus } from "../types";

async function executeQuery(
  db: any,
  sql: string,
  params: any[] = [],
): Promise<{ results: any[]; meta?: any }> {
  if (db && typeof db.prepare === "function") {
    const stmt = db.prepare(sql).bind(...params);
    if (sql.trim().toUpperCase().startsWith("SELECT")) {
      const results = await stmt.all();
      return { results: results.results || [] };
    }
    const res = await stmt.run();
    return { results: res.results || [], meta: res.meta };
  } else if (db && typeof db.query === "function") {
    return await db.query(sql, params);
  }
  throw new Error("Invalid D1 database instance provided");
}

export async function getFileHash(db: any, examId: string): Promise<string | null> {
  const { results } = await executeQuery(db, `SELECT file_hash FROM files WHERE exam_id = ?`, [
    examId,
  ]);
  return results[0]?.file_hash ?? null;
}

export async function getFileR2Key(db: any, examId: string): Promise<string | null> {
  const { results } = await executeQuery(db, `SELECT r2_key FROM files WHERE exam_id = ?`, [
    examId,
  ]);
  return results[0]?.r2_key ?? null;
}

export async function getFileId(db: any, examId: string): Promise<number | null> {
  const { results } = await executeQuery(db, `SELECT id FROM files WHERE exam_id = ?`, [examId]);
  return results[0]?.id ?? null;
}

export async function insertFile(
  db: any,
  msg: ScrapedExam,
  fileType: FileType,
  fileSize: number,
  r2Key: string,
  fileHash?: string,
): Promise<number> {
  const sql = `INSERT INTO files (exam_id, file_name, file_url, file_type, file_size, file_hash, r2_key, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'uploaded')
       ON CONFLICT(exam_id) DO UPDATE SET
         file_name = excluded.file_name,
         file_url = excluded.file_url,
         file_type = excluded.file_type,
         file_size = excluded.file_size,
         file_hash = excluded.file_hash,
         r2_key = excluded.r2_key,
         status = 'uploaded',
         updated_at = datetime('now')`;

  const baseName = msg.fileName ? msg.fileName.replace(/\.[^/.]+$/, "") : msg.examId;
  const correctFileName = `${baseName}.${fileType}`;
  const params = [
    msg.examId,
    correctFileName,
    msg.fileUrl,
    fileType,
    fileSize,
    fileHash || null,
    r2Key,
  ];
  const { meta, results } = await executeQuery(db, sql, params);

  if (meta?.last_row_id) return meta.last_row_id;
  if (results?.[0]?.id) return results[0].id;

  const fileRes = await executeQuery(db, `SELECT id FROM files WHERE exam_id = ?`, [msg.examId]);
  return fileRes.results[0]?.id || 0;
}

export async function insertExtractedText(
  db: any,
  fileId: number,
  content: string,
  pageCount: number | null,
  wordCount: number,
): Promise<void> {
  const sql = `INSERT INTO extracted_texts (file_id, content, page_count, word_count, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`;
  await executeQuery(db, sql, [fileId, content, pageCount, wordCount]);
}

export async function insertExamMetadata(db: any, fileId: number, msg: ScrapedExam): Promise<void> {
  // Delete old metadata to prevent duplicate rows for the same fileId
  await executeQuery(db, `DELETE FROM exam_metadata WHERE file_id = ?`, [fileId]);

  const sql = `INSERT INTO exam_metadata (file_id, exam_title, upload_date, created_at)
       VALUES (?, ?, ?, datetime('now'))`;
  await executeQuery(db, sql, [fileId, msg.examTitle, msg.uploadDate]);
}

export async function updateFileStatus(
  db: any,
  examId: string,
  status: FileStatus,
  errorMessage?: string,
): Promise<void> {
  const sql = errorMessage
    ? `UPDATE files SET status = ?, error_message = ?, updated_at = datetime('now') WHERE exam_id = ?`
    : `UPDATE files SET status = ?, updated_at = datetime('now') WHERE exam_id = ?`;

  const params = errorMessage ? [status, errorMessage, examId] : [status, examId];
  await executeQuery(db, sql, params);
}

export async function getUploadedFiles(
  db: any,
): Promise<
  { id: number; exam_id: string; r2_key: string; file_type: string; file_name: string }[]
> {
  const { results } = await executeQuery(
    db,
    `SELECT id, exam_id, r2_key, file_type, file_name FROM files WHERE status = 'uploaded'`,
  );
  return results || [];
}

export async function updateScanStatus(
  db: any,
  status: "updating" | "ready" | "failed",
  errorMessage?: string,
): Promise<void> {
  const sql = `INSERT INTO files (exam_id, file_name, file_url, file_type, status, error_message, updated_at)
       VALUES ('__SCAN_STATUS__', 'scan_status', '', 'system', ?, ?, datetime('now'))
       ON CONFLICT(exam_id) DO UPDATE SET
         status = excluded.status,
         error_message = excluded.error_message,
         updated_at = datetime('now')`;
  await executeQuery(db, sql, [status, errorMessage || null]);
}

export async function getAllStoredExams(
  db: any,
): Promise<{ id: number; exam_id: string; r2_key: string; file_name: string }[]> {
  const { results } = await executeQuery(
    db,
    `SELECT id, exam_id, r2_key, file_name FROM files WHERE exam_id != '__SCAN_STATUS__'`,
  );
  return results || [];
}

export async function deleteExamRecord(db: any, id: number): Promise<void> {
  await executeQuery(db, `DELETE FROM files WHERE id = ?`, [id]);
}

export async function getStoredExamsCount(db: any): Promise<number> {
  const { results } = await executeQuery(
    db,
    `SELECT COUNT(*) as total FROM files WHERE exam_id != '__SCAN_STATUS__'`,
  );
  return results[0]?.total || 0;
}
