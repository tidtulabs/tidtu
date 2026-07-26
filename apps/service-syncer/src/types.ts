export interface ScrapedExam {
  examId: string;
  examTitle: string;
  fileUrl: string;
  fileName: string;
  uploadDate: string;
  pagination: number;
  row: number;
}

export type FileStatus = "pending" | "downloading" | "uploaded" | "processing" | "done" | "failed";
export type FileType = "pdf" | "docx" | "xlsx" | "xls" | "unknown";

export interface FileRecord {
  id: number;
  exam_id: string;
  file_name: string;
  file_url: string;
  file_type: FileType;
  file_size: number | null;
  r2_key: string | null;
  status: FileStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExtractedText {
  id: number;
  file_id: number;
  content: string;
  page_count: number | null;
  word_count: number | null;
  created_at: string;
}

export interface ExamMetadata {
  id: number;
  file_id: number;
  exam_title: string | null;
  upload_date: string | null;
  subject: string | null;
  semester: string | null;
  created_at: string;
}

export interface ParseResult {
  content: string;
  pageCount: number | null;
  wordCount: number;
  metadata?: Record<string, string>;
}

export interface Env {
  DB: D1Database;
  TIDTU_FILES: R2Bucket;
  TIDTU_QUEUE: Queue;
  PDAOTAO_BASE_URL: string;
  CONSUMER_API_URL?: string;
  CONSUMER_SECRET_KEY?: string;
}
