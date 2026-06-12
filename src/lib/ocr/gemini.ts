import "server-only";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { ParsedReceiptSchema, type ParsedReceipt } from "@/schemas/bill";
import { getGeminiConfig } from "@/lib/settings";

// Receipt photo -> structured JSON via Gemini's constrained JSON output.

const RECEIPT_PROMPT = `Kamu adalah asisten yang membaca struk belanja Indonesia.
Ekstrak data dari gambar struk berikut menjadi JSON.

Aturan:
- Semua nominal uang dalam RUPIAH sebagai bilangan bulat (integer), tanpa titik/koma pemisah ribuan, tanpa simbol "Rp".
- "unitPrice" adalah harga SATUAN per item (harga total baris dibagi quantity). Bulatkan ke rupiah terdekat.
- "quantity" adalah jumlah item (minimal 1).
- "taxAmount" = total pajak/PB1/PPN. "serviceAmount" = total service charge. "discountAmount" = total diskon/potongan (nilai positif).
- Jangan masukkan baris subtotal/total/pajak/service/diskon sebagai item.
- Jika sebuah nilai tidak ada di struk, isi 0 atau string kosong.`;

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    merchantName: { type: SchemaType.STRING },
    items: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          quantity: { type: SchemaType.NUMBER },
          unitPrice: { type: SchemaType.NUMBER },
        },
        required: ["name", "quantity", "unitPrice"],
      },
    },
    taxAmount: { type: SchemaType.NUMBER },
    serviceAmount: { type: SchemaType.NUMBER },
    discountAmount: { type: SchemaType.NUMBER },
  },
  required: ["merchantName", "items", "taxAmount", "serviceAmount", "discountAmount"],
} as const;

export async function parseReceipt(
  imageBase64: string,
  mimeType: string,
): Promise<ParsedReceipt> {
  const { apiKey, model: modelName } = await getGeminiConfig();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY belum diset di server.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      responseSchema: responseSchema as any,
    },
  });

  const result = await model.generateContent([
    { text: RECEIPT_PROMPT },
    { inlineData: { data: imageBase64, mimeType } },
  ]);

  const text = result.response.text();
  const json = JSON.parse(text);
  return ParsedReceiptSchema.parse(json);
}
