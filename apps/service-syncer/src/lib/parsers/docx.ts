import { ParseResult } from "types";

export async function parseDocx(buffer: ArrayBuffer): Promise<ParseResult> {
  const mammoth = await importMammoth();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });

  const content = result.value.trim();
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  return { content, pageCount: null, wordCount };
}

async function importMammoth(): Promise<typeof import("mammoth")> {
  return import("mammoth");
}
