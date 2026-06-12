# Share hasil split ke WhatsApp

## Context

Sesi sudah punya share link read-only (`/share/{token}`) lewat drawer "Bagikan"
di `share-toggle.tsx`. User mau opsi tambahan: **kirim langsung ke WhatsApp**
sebagai pesan terformat (rincian split), dengan **link app di paling akhir**.

Keputusan user:
- Isi pesan: **lengkap** — total per bill + rincian per orang + transfer.
- Tampilkan **semua peserta** di rincian per orang (termasuk yang tagihannya 0).
- Tombol ada di **drawer "Bagikan"** yang sudah ada; kalau share link belum
  aktif, **auto-nyalain** dulu baru buka WhatsApp.
- Emoji dipakai (📋 per bill, 👉 link).

## Approach

### 1. Fungsi murni: `src/domain/whatsapp-summary.ts`

`buildWhatsappSummary(view: SessionView): string` — menghasilkan **body pesan**
(tanpa link app). Pure, tanpa I/O, di-unit-test seperti `settlement.test.ts`.
Pakai `formatIDR` (`domain/money`) dan `formatDate` (`lib/format`, pure).

Format pesan (markdown WhatsApp, `*bold*`):

```
*{view.title}*
{formatDate(view.date)}

📋 {merchantName} — {formatIDR(billTotal)}
📋 ...

*Rincian per orang:*
• {nama}: {formatIDR(owed[id])}     ← SEMUA peserta

*Siapa bayar ke siapa:*
• {dari} → {ke}: {formatIDR(amount)}
```

- Total per bill diambil dari `view.settlement.bills[i].total` (match `billId`).
- Kalau `transfers` kosong → baris "Semua sudah pas, gak ada yang perlu
  transfer." menggantikan daftar transfer.
- Diakhiri `Total: {formatIDR(grandTotal)}`.
- **Link app TIDAK di sini** — ditempel di client (butuh token + origin).

### 2. `src/components/share-toggle.tsx`

- Prop baru: `summary: string` (body dari fungsi #1).
- Tombol hijau **"Bagikan ke WhatsApp"** di dalam drawer (di atas/ dekat
  "Matikan link" saat token ada; juga tersedia saat belum aktif).
- Handler `shareToWhatsapp()`:
  1. Tentukan token: kalau sudah ada pakai itu; kalau belum, `await
     setShareEnabled(true)` → ambil `res.token`.
  2. Susun `shareUrl = ${origin}/share/${token}`.
  3. `text = ${summary}\n\nLihat detail 👉 ${shareUrl}`.
  4. `window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank")`.
  5. Toast error kalau enable gagal.

### 3. `src/app/(app)/sessions/[id]/page.tsx`

Kirim prop: `<ShareToggle ... summary={buildWhatsappSummary(view)} />`.
ShareToggle hanya relevan kalau ada bill — tapi tombol tetap render seperti
sekarang; `summary` aman untuk sesi tanpa bill (pesan minimal).

### Tidak berubah

`/share/[token]` page, server action `setShareEnabled`, schema/DB — tetap.

## Critical files

- **Baru:** `src/domain/whatsapp-summary.ts` + `whatsapp-summary.test.ts`.
- **Edit:** `src/components/share-toggle.tsx` — prop + tombol + handler.
- **Edit:** `src/app/(app)/sessions/[id]/page.tsx` — pass `summary` prop.

## Verification

1. Unit test: transfer ada, transfer kosong, multi-bill, peserta owed 0 tetap
   tampil, judul/tanggal benar.
2. `pnpm lint` & `pnpm test` hijau.
3. Manual: tap "Bagikan ke WhatsApp" saat link belum aktif → link auto-nyala,
   WhatsApp kebuka dengan teks terformat + link di akhir. Tap lagi saat sudah
   aktif → langsung buka tanpa bikin token baru.
