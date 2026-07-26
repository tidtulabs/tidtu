import { ParseResult } from "types";

export async function parseXlsx(buffer: ArrayBuffer): Promise<ParseResult> {
  const XLSX = await importXlsx();
  const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
  const texts: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
    for (const row of json) {
      const rowText = row.filter(Boolean).join(" | ");
      if (rowText.trim()) texts.push(rowText);
    }
  }

  const content = texts.join("\n");
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  return { content, pageCount: workbook.SheetNames.length, wordCount };
}

async function importXlsx(): Promise<typeof import("xlsx")> {
  return import("xlsx");
}
