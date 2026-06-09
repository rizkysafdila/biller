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
- **Multi-user**: tiap user daftar sendiri dan cuma lihat sesi & teman miliknya.
- **Teman tanpa akun**: teman cukup disimpan sebagai nama, gak perlu ikut login.
- **Share link read-only**: kirim hasil split ke grup tanpa mereka perlu login.
- **PWA**: installable, ada offline page & service worker.

## Tech stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- Prisma ORM + Postgres (Neon via Vercel)
- shadcn/ui (Base UI) + Tailwind CSS v4 — mobile-first
- Google Gemini (AI Studio) untuk OCR struk
- Vercel Blob untuk simpan foto struk
- Auth: register/login multi-user, password di-hash `bcryptjs`, session JWT
  (jose) di cookie httpOnly

## Arsitektur

```
src/
  domain/        # logika murni & teruji: money, settlement, analytics (+ test)
  lib/           # db, session, dal (auth), cache, ocr/gemini, blob, colors, format
  queries/       # read layer (server-only), per fitur: sessions, friends, bills, analysis
  schemas/       # validasi Zod (auth, friend, session, bill)
  server/        # server actions (mutations): auth, friends, sessions, bills
  components/    # UI (shadcn di ui/, + komponen fitur & drawer reusable)
  app/
    (auth)/      # login, register — di luar gate
    (app)/       # dashboard, sessions, friends, analysis — di balik auth
    share/       # halaman share read-only (publik via token)
    api/ocr/     # endpoint OCR struk
  proxy.ts       # gate auth optimistik (pengganti middleware di Next 16)
```

**Read vs write dipisah**: semua query baca data ada di `src/queries/`
(di-cache per-user pakai `unstable_cache` + tag, di-invalidate dari mutations
di `src/server/`). Page tinggal `requireUser()` lalu panggil query — tipis.

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
   - `GEMINI_API_KEY` dari https://aistudio.google.com/apikey (untuk OCR).
   - `BLOB_READ_WRITE_TOKEN` dari Vercel Blob (opsional; tanpa ini OCR tetap
     jalan, cuma foto struk tidak disimpan).
   - `OWNER_EMAIL` & `OWNER_PASSWORD` (opsional, legacy) — kalau diisi, akun lama
     tanpa password hash bakal otomatis di-migrate saat login pertama yang cocok.
3. **Migrasi DB**
   ```bash
   pnpm db:migrate      # buat tabel di Neon
   pnpm db:seed         # (opsional) seed data awal
   ```
4. **Jalankan**
   ```bash
   pnpm dev             # http://localhost:3000
   ```
   Buka `/register` buat bikin akun baru — tiap user otomatis dapat teman "Kamu"
   dan punya data sendiri.

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
2. Set env var: `SESSION_SECRET`, `GEMINI_API_KEY` (dan opsional `OWNER_EMAIL` /
   `OWNER_PASSWORD` buat migrate akun legacy).
3. Build command default (`next build`) sudah cukup. Jalankan migrasi sekali via
   `pnpm db:migrate` (atau `prisma migrate deploy` di pipeline).
