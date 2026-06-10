import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dal";
import { parseReceipt } from "@/lib/ocr/gemini";
import { uploadReceiptImage } from "@/lib/blob";
import {
  getOcrLimit,
  getWeekOcrCount,
  incrementOcrUsage,
} from "@/lib/ocr-usage";

export const runtime = "nodejs";
// Receipt parsing can take a few seconds.
export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  // Suspended accounts cannot scan receipts.
  if (user.disabledAt) {
    return NextResponse.json(
      { error: "Akun dinonaktifkan. Hubungi admin." },
      { status: 403 },
    );
  }

  // Enforce the per-user weekly receipt-scan limit.
  const limit = getOcrLimit(user);
  const used = await getWeekOcrCount(user.id);
  if (used >= limit) {
    return NextResponse.json(
      { error: "Batas scan struk mingguan tercapai." },
      { status: 429 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File gambar tidak ada." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File harus berupa gambar." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Ukuran gambar maksimal 8 MB." }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Store the image (best-effort) and parse it. Run together to save time.
    const [imageUrl, parsed] = await Promise.all([
      uploadReceiptImage(file).catch(() => null),
      parseReceipt(base64, file.type),
    ]);

    // Only count successful scans against the weekly limit.
    await incrementOcrUsage(user.id);

    return NextResponse.json({ parsed, imageUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal memproses struk.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
