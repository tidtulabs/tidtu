-- Migration 001: Initial schema
CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  file_hash TEXT,
  r2_key TEXT,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS extracted_texts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id INTEGER NOT NULL REFERENCES files(id),
  content TEXT NOT NULL,
  page_count INTEGER,
  word_count INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS exam_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id INTEGER NOT NULL REFERENCES files(id),
  exam_title TEXT,
  upload_date TEXT,
  subject TEXT,
  semester TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
CREATE INDEX IF NOT EXISTS idx_files_exam_id ON files(exam_id);
CREATE INDEX IF NOT EXISTS idx_extracted_texts_file_id ON extracted_texts(file_id);
CREATE INDEX IF NOT EXISTS idx_exam_metadata_file_id ON exam_metadata(file_id);
