export async function uploadToR2(
  bucket: R2Bucket,
  key: string,
  buffer: ArrayBuffer,
  fileType: string,
): Promise<string> {
  const object = await bucket.put(key, buffer, {
    httpMetadata: { contentType: getContentType(fileType) },
    customMetadata: {
      uploadedAt: new Date().toISOString(),
    },
  });

  return object.key;
}

function getContentType(fileType: string): string {
  const map: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xls: "application/vnd.ms-excel",
  };
  return map[fileType] || "application/octet-stream";
}
