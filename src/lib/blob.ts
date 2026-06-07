import "server-only";
import { put } from "@vercel/blob";

/**
 * Upload a receipt image to Vercel Blob and return its public URL. Returns null
 * if Blob storage isn't configured, so OCR still works without persisting the
 * image.
 */
export async function uploadReceiptImage(file: File): Promise<string | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const key = `receipts/${crypto.randomUUID()}.${ext}`;
  const blob = await put(key, file, {
    access: "public",
    contentType: file.type || "image/jpeg",
  });
  return blob.url;
}
