import * as cheerio from "cheerio";
import { ScrapedExam } from "../types";

function parseExamsFromPage(
  html: string,
  pageNum: number,
): { items: ScrapedExam[]; nextHref: string | null } {
  const $ = cheerio.load(html);
  const items: ScrapedExam[] = [];
  let nextHref: string | null = null;

  const rows = $(".border_main table tr");

  rows.each((_, trElement) => {
    const td = $(trElement).find("td").first();
    const links = td.find("a");

    const paginationLinks = links.filter((_, el) => {
      const text = $(el).text().trim();
      return text === ">>" || /^\d+$/.test(text);
    });

    if (paginationLinks.length > 0) {
      const nextLink = links.filter((_, el) => $(el).text().trim() === ">>").last();
      if (nextLink.length > 0) {
        const href = nextLink.attr("href") || "";
        if (href) {
          nextHref = href.replace(/^\.\//, "").replace(/^\.\.\//, "");
        }
      }
      return;
    }

    links.each((_, linkElement) => {
      const href = $(linkElement).attr("href") || "";
      const match = /ID=(\d+)/.exec(href);
      if (!match) return;

      const text = $(linkElement).text().trim();
      const parts = text
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean);
      const examTitle = parts[0] || "";
      const uploadDate = parts[1] ? parts[1].replace(/[()]/g, "") : "";
      const examId = match[1];

      // Keep Vietnamese accented characters, only remove characters forbidden by OS and spaces
      const sanitizedTitle = examTitle
        .replace(/[/\\?%*:|"<>]/g, "-") // Replace forbidden characters with hyphen
        .replace(/\s+/g, "_"); // Replace spaces with underscore
      const fileName = sanitizedTitle; // Do not hardcode file extension anymore

      items.push({
        examId,
        examTitle,
        fileUrl: href,
        fileName,
        uploadDate,
        pagination: pageNum,
        row: items.length + 1,
      });
    });
  });

  return { items, nextHref };
}

function resolveUrl(baseUrl: string, href: string): string {
  if (href.startsWith("http")) return href;
  if (href.startsWith("?")) return `${baseUrl}/EXAM_LIST${href}`;
  if (href.startsWith("/")) return `${baseUrl}${href}`;
  return `${baseUrl}/${href}`;
}

export async function fetchPageExams(
  baseUrl: string,
  pageUrl: string | null,
  pageNum: number,
): Promise<{ items: ScrapedExam[]; nextHref: string | null }> {
  const url = pageUrl ? resolveUrl(baseUrl, pageUrl) : `${baseUrl}/EXAM_LIST`;
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Scan failed: HTTP ${response.status} for ${url}`);

  const html = await response.text();
  return parseExamsFromPage(html, pageNum);
}

export async function filterNewOrUpdated(db: any, items: ScrapedExam[]): Promise<ScrapedExam[]> {
  if (items.length === 0) return [];

  const examIds = [...new Set(items.map((i) => i.examId))];
  const existing = new Map<string, string | null>();

  for (let i = 0; i < examIds.length; i += 100) {
    const batch = examIds.slice(i, i + 100);
    const placeholders = batch.map(() => "?").join(",");
    const sql = `SELECT f.exam_id, m.upload_date FROM files f LEFT JOIN exam_metadata m ON f.id = m.file_id WHERE f.exam_id IN (${placeholders}) AND f.file_hash IS NOT NULL`;

    let results: { exam_id: string; upload_date: string | null }[] = [];
    if (db && typeof db.prepare === "function") {
      const res = await db
        .prepare(sql)
        .bind(...batch)
        .all();
      results = res.results || [];
    } else if (db && typeof db.query === "function") {
      const res = await db.query(sql, batch);
      results = res.results || [];
    }

    for (const r of results) {
      existing.set(r.exam_id, r.upload_date);
    }
  }

  const newItems: ScrapedExam[] = [];

  for (const item of items) {
    const existingDate = existing.get(item.examId);
    if (existingDate === undefined) {
      newItems.push(item);
    } else if (item.uploadDate !== existingDate) {
      newItems.push(item);
    }
  }

  return newItems;
}
