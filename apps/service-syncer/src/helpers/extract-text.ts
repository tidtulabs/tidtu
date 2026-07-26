import { ParseResult, FileType } from "../types";
import { parsePdf } from "../lib/parsers/pdf";
import { parseDocx } from "../lib/parsers/docx";
import { parseXlsx } from "../lib/parsers/xlsx";

export async function extractText(buffer: ArrayBuffer, fileType: FileType): Promise<ParseResult> {
  switch (fileType) {
    case "pdf":
      return parsePdf(buffer);
    case "docx":
      return parseDocx(buffer);
    case "xlsx":
    case "xls":
      return parseXlsx(buffer);
    default:
      return { content: "", pageCount: null, wordCount: 0 };
  }
}
