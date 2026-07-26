import { useMutation } from "@tanstack/vue-query";
import { HttpError } from "./httpError";

export async function getExamDownloadLink(id: string) {
  // throw new HttpError("Tập tin đề thi bị lỗi cấu trúc dữ liệu", 500, "STRUCT_INVALID");
  const response = await fetch(
    `${import.meta.env.VITE_GATEWAY_SERVICE}/api/v1/pdaotao/exams/${id}/download`,
    { credentials: "include" },
  );

  if (!response.ok) {
    let errMsg = "Có lỗi xảy ra";
    let typeError: string | null = null;
    try {
      const data = await response.json();
      typeError = data.typeError || null;
      if (response.status === 429) {
        errMsg = "Yêu cầu quá thường xuyên";
      } else {
        errMsg = data.message || errMsg;
      }
    } catch (_) {}
    throw new HttpError(errMsg, response.status, typeError);
  }

  const contentType = response.headers.get("Content-Type") || "";

  // If response is binary (R2 direct stream fallback) instead of JSON
  if (!contentType.includes("application/json")) {
    const rawBlob = await response.blob();
    const blob = new Blob([rawBlob], { type: contentType });
    const blobUrl = URL.createObjectURL(blob);
    const contentDisposition = response.headers.get("Content-Disposition") || "";

    let filename = `${id}.pdf`;

    // Parse RFC 5987 UTF-8 filename format first
    const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
    // Fallback to standard filename format
    const standardMatch = /filename="?([^";]+)"?/.exec(contentDisposition);

    const matchedPart = (utf8Match && utf8Match[1]) || (standardMatch && standardMatch[1]);
    if (matchedPart) {
      try {
        filename = decodeURIComponent(matchedPart.trim());
      } catch (_) {
        filename = matchedPart.trim();
      }
    }

    return {
      success: true,
      data: {
        url: blobUrl,
        filename,
        isBlob: true,
      },
    };
  }

  return response.json();
}

export function useExamDownloadLinkMutation() {
  return useMutation({
    mutationFn: ({ id }: { id: string }) => getExamDownloadLink(id),
  });
}
