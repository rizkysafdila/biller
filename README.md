# Patungan 🧾

Split-bill app buat nongkrong bareng temen. Satu **sesi nongkrong** bisa nampung
**banyak bill** dari tempat berbeda, terus dikonsolidasi jadi **"siapa transfer ke
siapa"** lintas semua tempat. Bisa **scan struk (OCR)** biar input-nya cepat.

## Fitur

- **Sesi → banyak bill**: catat tiap tempat sebagai bill terpisah dalam satu sesi.
- **Split per item + shared item**: assign tiap item ke satu/banyak orang; pajak,
  service, dan diskon otomatis di-prorate per orang.
- **Konsolidasi**: total per orang + daftar transfer minimal lintas semua bill.
- **Scan struk (Gemini OCR)**: foto struk → item & harga ke-prefill, tinggal koreksi.
- **Teman tanpa akun**: cukup kamu yang login; teman disimpan sebagai nama.
- **Share link read-only**: kirim hasil split ke grup tanpa mereka perlu login.

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Prisma ORM + Postgres (Neon via Vercel)
- shadcn/ui (Base UI) + Tailwind CSS v4 — mobile-first
- Google Gemini (AI Studio) untuk OCR struk
- Vercel Blob untuk simpan foto struk
- Auth: session JWT (jose) di cookie httpOnly — single owner

## Arsitektur

```
src/
  domain/        # logika murni & teruji: money.ts, settlement.ts (+ test)
  lib/           # db, session, dal (auth), ocr/gemini, blob, session-view
  schemas/       # validasi Zod (friend, session, bill)
  server/        # server actions: auth, friends, sessions, bills
  components/    # UI (shadcn + komponen fitur)
  app/           # routes (login, dashboard, sessions, friends, share, api/ocr)
  proxy.ts       # gate auth optimistik (pengganti middleware di Next 16)
```

Inti perhitungan ada di `src/domain/settlement.ts` — fungsi murni tanpa I/O,
sehingga gampang di-test dan dipercaya. Jalankan `pnpm test`.

## Setup lokal

1. **Install deps**
   ```bash
   pnpm install
   ```
2. **Isi environment** — salin `.env.example` ke `.env`, lalu isi:
   - `DATABASE_URL` & `DIRECT_URL` dari project Neon (pooled + direct).
   - `SESSION_SECRET` (string acak panjang).
   - `OWNER_EMAIL` & `OWNER_PASSWORD` (kredensial login kamu).
   - `GEMINI_API_KEY` dari https://aistudio.google.com/apikey (untuk OCR).
   - `BLOB_READ_WRITE_TOKEN` dari Vercel Blob (opsional; tanpa ini OCR tetap
     jalan, cuma foto struk tidak disimpan).
3. **Migrasi DB**
   ```bash
   pnpm db:migrate      # buat tabel di Neon
   pnpm db:seed         # (opsional) buat user owner + "Kamu"
   ```
4. **Jalankan**
   ```bash
   pnpm dev             # http://localhost:3000
   ```
   Login pakai `OWNER_EMAIL` / `OWNER_PASSWORD`. User owner otomatis dibuat saat
   login pertama.

## Scripts

| Perintah          | Fungsi                                  |
| ----------------- | --------------------------------------- |
| `pnpm dev`        | Dev server                              |
| `pnpm build`      | Build produksi                          |
| `pnpm test`       | Unit test logika settlement (Vitest)    |
| `pnpm db:migrate` | Prisma migrate dev                      |
| `pnpm db:push`    | Sinkron schema tanpa migrasi            |
| `pnpm db:seed`    | Seed owner                              |
| `pnpm db:studio`  | Prisma Studio                           |

## Deploy ke Vercel

1. Import repo ke Vercel, tambahkan integrasi **Neon** (mengisi `DATABASE_URL` /
   `DIRECT_URL`) dan **Blob** (`BLOB_READ_WRITE_TOKEN`).
2. Set env var: `SESSION_SECRET`, `OWNER_EMAIL`, `OWNER_PASSWORD`, `GEMINI_API_KEY`.
3. Build command default (`next build`) sudah cukup. Jalankan migrasi sekali via
   `pnpm db:migrate` (atau `prisma migrate deploy` di pipeline).
