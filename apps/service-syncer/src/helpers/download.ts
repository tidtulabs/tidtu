import * as cheerio from "cheerio";
import { FileType } from "../types";

export function detectFileType(fileName: string): FileType {
  const ext = fileName.toLowerCase().split(".").pop();
  switch (ext) {
    case "pdf":
      return "pdf";
    case "docx":
      return "docx";
    case "xlsx":
      return "xlsx";
    case "xls":
      return "xls";
    default:
      return "unknown";
  }
}

function normalizeEndpoint(href: string): string {
  if (!href || typeof href !== "string") {
    throw new Error("Invalid href");
  }
  if (href.startsWith("../")) {
    href = href.replace(/^\.\.\//, "/");
  } else if (href.startsWith("./")) {
    href = href.replace(/^\.\//, "/");
  } else if (!href.startsWith("/")) {
    href = `/${href}`;
  }
  const match = /^\/(.*)/.exec(href);
  if (match && match[1]) {
    return match[1];
  }
  throw new Error("Invalid href format");
}

export async function resolveRealDownloadUrl(baseUrl: string, detailUrl: string): Promise<string> {
  const url = detailUrl.startsWith("http") ? detailUrl : `${baseUrl}/${detailUrl}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch detail page: HTTP ${response.status} for ${url}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const rows = $(".border_main").find("table").find("tr").first().find("td");
  const href = $(rows).find("tr").find("a").eq(1).attr("href");

  if (!href) {
    throw new Error(`Download link not found in detail page: ${url}`);
  }

  const endpoint = normalizeEndpoint(href);
  return `${baseUrl}/${endpoint}`;
}

export async function downloadFile(
  baseUrl: string,
  fileUrl: string,
): Promise<{
  buffer: ArrayBuffer;
  fileType: FileType;
  fileSize: number;
}> {
  const realUrl = await resolveRealDownloadUrl(baseUrl, fileUrl);

  const response = await fetch(realUrl, {
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    throw new Error(`Download failed: HTTP ${response.status} for ${realUrl}`);
  }

  const buffer = await response.arrayBuffer();
  const fileSize = buffer.byteLength;
  const fileName = realUrl.split("/").pop() || "unknown";
  const fileType = detectFileType(fileName);

  return { buffer, fileType, fileSize };
}
