# Spend Analysis — Design Spec

**Date:** 2026-06-08
**Status:** Approved (pending spec review)

## Goal

Tambah menu **Analisis** yang nampilin pengeluaran bulanan tiap orang, biar tahu
siapa yang paling banyak "jajan" tiap bulan dari semua sesi nongkrong.

## Product decisions (confirmed)

| Pertanyaan | Keputusan |
|---|---|
| Metrik "spending" per orang | **Yang dia konsumsi** = total porsi item + prorata pajak/service − diskon yang dibebankan ke dia. Bukan yang dia nalangin. |
| Cakupan | **Semua peserta** (tiap teman yang pernah ikut), bukan cuma owner. |
| Penentu bulan | **Tanggal sesi** (`Session.date`). |
| Layout utama | **Selektor bulan + ranking orang**: pilih bulan → total bulan itu → daftar orang diurutin dari paling boros, dengan bar proporsi. |
| Chart | **Recharts** via komponen `chart` shadcn (horizontal bar chart). |

## Sumber data

Settlement engine yang ada udah ngitung semuanya:

- `computeSessionSettlement(...)` → `SessionSettlement.owed[participantId]` =
  **"total yang dibebankan/dikonsumsi tiap peserta di sesi itu"**. Persis metrik yang kita mau.
- `SessionView.participants[]` punya `friendId`, `name`, `avatarColor`.

Jadi kita **reuse** settlement, gak ngitung ulang. Agregasi pakai `friendId`
(tahan rename / duplikat owner), tapi nampilin `name` + `avatarColor` terkini.

## Arsitektur

Ngikutin pola yang ada: domain murni (tested) + `lib/*-view` (I/O) + UI tipis.

### 1. Domain murni — `src/domain/analytics.ts` (Vitest)

Fungsi murni, tanpa I/O, gampang di-test.

```ts
export interface SpendRecord {
  monthKey: string;   // "YYYY-MM", dari Session.date (waktu lokal)
  friendId: string;
  name: string;
  color: string;
  amount: number;     // integer rupiah, dari owed[participantId]
}

export interface PersonSpend {
  friendId: string;
  name: string;
  color: string;
  amount: number;
  share: number;      // 0..1 proporsi terhadap total bulan itu
}

export interface MonthlySpending {
  monthKey: string;   // "YYYY-MM"
  total: number;
  perPerson: PersonSpend[];  // diurutin amount desc, hanya amount > 0
}

// Group by month, lalu by friendId; balikin diurutin monthKey DESC (terbaru dulu).
export function aggregateMonthlySpending(records: SpendRecord[]): MonthlySpending[];
```

Aturan:
- Group `records` by `monthKey`, lalu jumlahin `amount` per `friendId`.
- `total` = jumlah semua amount di bulan itu.
- `perPerson` hanya yang `amount > 0`, sorted desc; `share = amount / total`
  (kalau `total === 0`, `share = 0`).
- Bulan tanpa record gak muncul (gak ada entri kosong).
- `label` (mis. "Juni 2026") **bukan** tanggung jawab domain — diformat di UI dari `monthKey`.

### 2. I/O — `src/lib/analytics-view.ts` (`server-only`)

```ts
export async function getMonthlySpending(userId: string): Promise<MonthlySpending[]>;
```

- Reuse helper baru `getAllSessionViews(userId)` yang di-export dari
  `session-view.ts` (ngembaliin `SessionView[]` pakai `includeShape` + `toView`
  yang udah ada — gak duplikasi logika settlement).
- Untuk tiap sesi & tiap peserta: bikin `SpendRecord` dari
  `settlement.owed[participant.id]`, `monthKey` dari `session.date`.
- Panggil `aggregateMonthlySpending(records)`.

`session-view.ts` di-refactor kecil: ekstrak `getAllSessionViews(userId)` yang
query `db.session.findMany({ where: { userId }, include: includeShape })` lalu
`.map(toView)`. `getSessionView` tetap seperti sebelumnya.

### 3. UI — route `/analysis`

- `src/app/(app)/analysis/page.tsx` (server component): panggil `requireUser()`
  + `getMonthlySpending(user.id)`, lempar `MonthlySpending[]` ke client component.
- `src/components/spend-analysis.tsx` (client):
  - State: index bulan terpilih (default 0 = terbaru).
  - **Selektor bulan**: `◀  Juni 2026  ▶`. Tombol ◀▶ pindah antar bulan yang
    ada datanya (disabled di ujung). Label diformat dari `monthKey` pakai
    `Intl`/helper format yang ada.
  - **Total bulan**: `formatIDR(total)`.
  - **Ranking**: horizontal bar chart pakai shadcn `ChartContainer` + Recharts
    `BarChart` (layout vertical→horizontal bars), satu bar per orang, diurutin,
    tiap bar diwarnain `color` (avatarColor) lewat `<Cell>`. Tiap baris/label
    nampilin avatar + nama + `formatIDR(amount)` + persen.
  - **Empty state**: kalau `months.length === 0` (belum ada sesi / belum ada
    item ke-assign) → `EmptyState` "Belum ada data pengeluaran".
- `src/app/(app)/analysis/loading.tsx`: skeleton (header + bar list) pakai
  building block di `components/skeletons.tsx`.

### 4. Navigasi

Tambah item ke-4 ke `src/components/app-nav.tsx`:
`{ href: "/analysis", label: "Analisis", icon: ChartColumn }` (lucide).
Bottom nav jadi 4 item (Beranda / Sesi / Analisis / Teman).

### 5. Dependency

`pnpm dlx shadcn@latest add chart` → nambah `src/components/ui/chart.tsx` +
`recharts`. Verifikasi komponen kompatibel sama varian Base UI (chart shadcn
berbasis Recharts murni, gak terikat Radix).

## Edge cases

- Item belum di-assign ke siapa pun → gak masuk `owed` → gak dihitung (konsisten
  dgn settlement). Gak perlu ditampilin di sini.
- Peserta yang ikut tapi konsumsi 0 di bulan itu → gak muncul di ranking.
- Owner duplikat (bug terpisah yg diketahui) → karena agregasi by `friendId`,
  dua row owner beda tetap kepisah; ini gak diperbaiki di sini.
- Timezone: `monthKey` diturunin dari `Session.date` pakai waktu lokal server.
  Cukup buat MVP; dicatat sebagai keterbatasan.

## Testing

`src/domain/analytics.test.ts` (Vitest), skenario:
- Satu bulan, beberapa orang → urutan desc + share benar + total benar.
- Satu orang muncul di beberapa sesi dalam bulan sama → ke-sum.
- Beberapa bulan → output diurutin terbaru dulu.
- Orang dgn amount 0 → gak masuk `perPerson`.
- Records kosong → `[]`.

## Out of scope (YAGNI)

- Grafik tren multi-bulan / donut.
- Filter/drilldown per orang, audit sesi.
- Export CSV/gambar.
- Precompute agregat di DB (catatan optimasi kalau data membesar; sekarang load
  semua sesi user saat render — aman buat skala personal).

## Verifikasi

- `pnpm test` → unit test `analytics.ts` lulus.
- `pnpm build` + typecheck lolos.
- Manual: buat 2 sesi beda bulan, assign item, buka /analisis → cek selektor
  bulan, total, ranking sesuai hitungan tangan; bar warna sesuai avatar.
