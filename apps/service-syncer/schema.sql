-- Table storing exam file information
CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  file_hash TEXT,
  r2_key TEXT,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table storing exam metadata (exam title, upload date)
CREATE TABLE IF NOT EXISTS exam_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id INTEGER NOT NULL,
  exam_title TEXT NOT NULL,
  upload_date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
);

-- Table storing extracted text content from exam files
CREATE TABLE IF NOT EXISTS extracted_texts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  page_count INTEGER,
  word_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
);

-- Indexes to optimize search queries
CREATE INDEX IF NOT EXISTS idx_files_exam_id ON files(exam_id);
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
CREATE INDEX IF NOT EXISTS idx_exam_metadata_file_id ON exam_metadata(file_id);
CREATE INDEX IF NOT EXISTS idx_extracted_texts_file_id ON extracted_texts(file_id);
