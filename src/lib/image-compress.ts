// Client-side image compression for receipt photos, run before upload to /api/ocr.
// Phone cameras produce 3–12 MB images; shrinking them in the browser speeds up
// the upload, avoids the server's 8 MB limit, and keeps the Gemini payload small.

interface CompressOptions {
  /** Longest edge of the output image, in pixels. */
  maxEdge?: number;
  /** JPEG quality, 0–1. */
  quality?: number;
  /** Files smaller than this are sent as-is, no compression. */
  skipUnderBytes?: number;
}

const DEFAULTS: Required<CompressOptions> = {
  maxEdge: 1600,
  quality: 0.7,
  skipUnderBytes: 512 * 1024,
};

/**
 * Resize + re-encode an image File to JPEG. Returns the original file untouched
 * when it's not an image, already small, or anything goes wrong — OCR still runs
 * either way (the server keeps its own size/type validation).
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<File> {
  const { maxEdge, quality, skipUnderBytes } = { ...DEFAULTS, ...options };

  if (!file.type.startsWith("image/") || file.size <= skipUnderBytes) {
    return file;
  }

  try {
    // `from-image` applies EXIF orientation so portrait phone photos aren't rotated.
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });

    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    // Bail out if encoding failed or didn't actually save space.
    if (!blob || blob.size >= file.size) {
      return file;
    }

    const base = file.name.replace(/\.[^/.]+$/, "") || "receipt";
    return new File([blob], `${base}.jpg`, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}
