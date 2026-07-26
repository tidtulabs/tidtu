import { ParseResult } from "types";

export async function parsePdf(buffer: ArrayBuffer): Promise<ParseResult> {
  const bytes = new Uint8Array(buffer);
  const text = extractTextFromPdfBytes(bytes);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const pageCount = estimatePageCount(bytes);

  return { content: text, pageCount, wordCount };
}

function extractTextFromPdfBytes(bytes: Uint8Array): string {
  const decoder = new TextDecoder("utf-8");
  const raw = decoder.decode(bytes);
  const texts: string[] = [];

  const btRegex = /BT([\s\S]*?)ET/g;
  let match: RegExpExecArray | null;

  while ((match = btRegex.exec(raw)) !== null) {
    const block = match[1];
    const textMatches = block.match(/\(([^)]*)\)/g);
    if (textMatches) {
      for (const t of textMatches) {
        const cleaned = t
          .slice(1, -1)
          .replace(/\\([nrt])/g, (_, c: string) => (c === "n" ? "\n" : c === "r" ? "\r" : "\t"))
          .replace(/\\(.)/g, "$1");
        if (cleaned.trim()) texts.push(cleaned);
      }
    }
  }

  return texts.join(" ");
}

function estimatePageCount(bytes: Uint8Array): number {
  const decoder = new TextDecoder("utf-8");
  const raw = decoder.decode(bytes);
  const matches = raw.match(/\/Type\s*\/Page[^s]/g);
  return matches ? matches.length : 1;
}
