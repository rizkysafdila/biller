# Spend Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tambah menu **Analisis** yang nampilin pengeluaran (konsumsi) bulanan tiap orang, dengan selektor bulan + ranking bar chart.

**Architecture:** Domain murni (`analytics.ts`, di-unit-test) ngagregasi `SpendRecord` jadi `MonthlySpending[]`. Lib `analytics-view.ts` (server-only) reuse settlement engine yang ada (`settlement.owed`) lewat `getAllSessionViews`, lalu panggil domain. UI route `/analysis` render selektor bulan + Recharts horizontal bar chart.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Prisma, Recharts via shadcn `chart` component, Vitest.

---

## File Structure

- Create `src/domain/analytics.ts` — pure aggregation (no I/O).
- Create `src/domain/analytics.test.ts` — Vitest.
- Modify `src/lib/session-view.ts` — export new `getAllSessionViews(userId)`.
- Create `src/lib/analytics-view.ts` — `getMonthlySpending(userId)`.
- Create `src/components/ui/chart.tsx` — via `shadcn add chart` (also installs recharts).
- Create `src/components/spend-analysis.tsx` — client UI.
- Create `src/app/(app)/analysis/page.tsx` — server page.
- Create `src/app/(app)/analysis/loading.tsx` — skeleton.
- Modify `src/components/app-nav.tsx` — add 4th nav item.

> **Note on cwd:** the Bash tool's working dir may be `D:\Code`, not the repo. Run git/pnpm with an explicit repo dir, e.g. `git -C /d/Code/patungan ...` and `pnpm -C /d/Code/patungan ...` (or `cd` first). Vitest filter: `pnpm -C /d/Code/patungan test -- src/domain/analytics.test.ts`.

---

### Task 1: Domain — `aggregateMonthlySpending`

**Files:**
- Create: `src/domain/analytics.ts`
- Test: `src/domain/analytics.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/domain/analytics.test.ts
import { describe, it, expect } from "vitest";
import { aggregateMonthlySpending, type SpendRecord } from "./analytics";

const rec = (
  monthKey: string,
  friendId: string,
  amount: number,
  name = friendId,
  color = "#000",
): SpendRecord => ({ monthKey, friendId, name, color, amount });

describe("aggregateMonthlySpending", () => {
  it("returns [] for no records", () => {
    expect(aggregateMonthlySpending([])).toEqual([]);
  });

  it("ranks people in a month by amount desc with correct total and share", () => {
    const [month] = aggregateMonthlySpending([
      rec("2026-06", "a", 200, "Rizky"),
      rec("2026-06", "b", 300, "Budi"),
    ]);
    expect(month.monthKey).toBe("2026-06");
    expect(month.total).toBe(500);
    expect(month.perPerson.map((p) => p.name)).toEqual(["Budi", "Rizky"]);
    expect(month.perPerson[0].amount).toBe(300);
    expect(month.perPerson[0].share).toBeCloseTo(0.6);
  });

  it("sums the same friend across multiple sessions in one month", () => {
    const [month] = aggregateMonthlySpending([
      rec("2026-06", "a", 200),
      rec("2026-06", "a", 150),
    ]);
    expect(month.perPerson).toHaveLength(1);
    expect(month.perPerson[0].amount).toBe(350);
  });

  it("uses the latest name/color seen for a friend", () => {
    const [month] = aggregateMonthlySpending([
      rec("2026-06", "a", 100, "Old", "#111"),
      rec("2026-06", "a", 100, "New", "#222"),
    ]);
    expect(month.perPerson[0].name).toBe("New");
    expect(month.perPerson[0].color).toBe("#222");
  });

  it("sorts months newest first", () => {
    const months = aggregateMonthlySpending([
      rec("2026-04", "a", 100),
      rec("2026-06", "a", 100),
      rec("2026-05", "a", 100),
    ]);
    expect(months.map((m) => m.monthKey)).toEqual(["2026-06", "2026-05", "2026-04"]);
  });

  it("excludes people with zero amount", () => {
    const [month] = aggregateMonthlySpending([
      rec("2026-06", "a", 0),
      rec("2026-06", "b", 100),
    ]);
    expect(month.perPerson.map((p) => p.friendId)).toEqual(["b"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C /d/Code/patungan test -- src/domain/analytics.test.ts`
Expected: FAIL — cannot find module `./analytics`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/domain/analytics.ts
/**
 * Spend analytics — pure aggregation, no I/O.
 *
 * Turns a flat list of per-person, per-session consumption records into a
 * month-by-month ranking of who spent the most. "Spend" = the amount charged to
 * a person (their item shares + prorated tax/service − discount), i.e.
 * `SessionSettlement.owed`, NOT what they fronted.
 */

export interface SpendRecord {
  /** "YYYY-MM" derived from the session date (local time). */
  monthKey: string;
  friendId: string;
  name: string;
  color: string;
  /** Integer rupiah charged to this person for one session. */
  amount: number;
}

export interface PersonSpend {
  friendId: string;
  name: string;
  color: string;
  amount: number;
  /** Proportion of the month total, 0..1 (0 when the month total is 0). */
  share: number;
}

export interface MonthlySpending {
  monthKey: string;
  total: number;
  /** Sorted by amount desc; only people with amount > 0. */
  perPerson: PersonSpend[];
}

export function aggregateMonthlySpending(records: SpendRecord[]): MonthlySpending[] {
  // monthKey -> friendId -> accumulator
  const byMonth = new Map<
    string,
    Map<string, { name: string; color: string; amount: number }>
  >();

  for (const r of records) {
    let friends = byMonth.get(r.monthKey);
    if (!friends) {
      friends = new Map();
      byMonth.set(r.monthKey, friends);
    }
    const prev = friends.get(r.friendId);
    friends.set(r.friendId, {
      // Latest record wins for display fields.
      name: r.name,
      color: r.color,
      amount: (prev?.amount ?? 0) + r.amount,
    });
  }

  const months: MonthlySpending[] = [];
  for (const [monthKey, friends] of byMonth) {
    const people = [...friends.entries()].map(([friendId, v]) => ({
      friendId,
      ...v,
    }));
    const total = people.reduce((acc, p) => acc + p.amount, 0);
    const perPerson: PersonSpend[] = people
      .filter((p) => p.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .map((p) => ({
        friendId: p.friendId,
        name: p.name,
        color: p.color,
        amount: p.amount,
        share: total > 0 ? p.amount / total : 0,
      }));
    months.push({ monthKey, total, perPerson });
  }

  // Newest month first.
  months.sort((a, b) => (a.monthKey < b.monthKey ? 1 : a.monthKey > b.monthKey ? -1 : 0));
  return months;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C /d/Code/patungan test -- src/domain/analytics.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git -C /d/Code/patungan add src/domain/analytics.ts src/domain/analytics.test.ts
git -C /d/Code/patungan commit -m "feat: add monthly spend aggregation domain logic"
```

---

### Task 2: Reuse — export `getAllSessionViews`

**Files:**
- Modify: `src/lib/session-view.ts`

- [ ] **Step 1: Add the helper** (next to `getSessionView`, reusing `includeShape` + `toView`)

```ts
/** Load every session owned by `userId`, each with settlement computed. */
export async function getAllSessionViews(userId: string): Promise<SessionView[]> {
  const sessions = await db.session.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    include: includeShape,
  });
  return sessions.map(toView);
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm -C /d/Code/patungan exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git -C /d/Code/patungan add src/lib/session-view.ts
git -C /d/Code/patungan commit -m "refactor: add getAllSessionViews helper"
```

---

### Task 3: I/O — `getMonthlySpending`

**Files:**
- Create: `src/lib/analytics-view.ts`

- [ ] **Step 1: Implement**

```ts
// src/lib/analytics-view.ts
import "server-only";
import { getAllSessionViews } from "./session-view";
import {
  aggregateMonthlySpending,
  type MonthlySpending,
  type SpendRecord,
} from "@/domain/analytics";

/** "YYYY-MM" from a Date, local time. */
function monthKeyOf(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Monthly consumption ranking across all of a user's sessions. */
export async function getMonthlySpending(userId: string): Promise<MonthlySpending[]> {
  const sessions = await getAllSessionViews(userId);

  const records: SpendRecord[] = [];
  for (const s of sessions) {
    const monthKey = monthKeyOf(s.date);
    for (const p of s.participants) {
      records.push({
        monthKey,
        friendId: p.friendId,
        name: p.name,
        color: p.avatarColor,
        amount: s.settlement.owed[p.id] ?? 0,
      });
    }
  }

  return aggregateMonthlySpending(records);
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm -C /d/Code/patungan exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git -C /d/Code/patungan add src/lib/analytics-view.ts
git -C /d/Code/patungan commit -m "feat: add getMonthlySpending data loader"
```

---

### Task 4: Add the shadcn chart component (Recharts)

**Files:**
- Create: `src/components/ui/chart.tsx` (generated)
- Modify: `package.json` (recharts added)

- [ ] **Step 1: Add component**

Run: `pnpm -C /d/Code/patungan dlx shadcn@latest add chart`
Expected: creates `src/components/ui/chart.tsx`, installs `recharts`. If it prompts, accept defaults / overwrite=no.

- [ ] **Step 2: Verify install**

Run: `node -e "require('/d/Code/patungan/node_modules/recharts/package.json'); console.log('ok')"`
Expected: prints `ok`. And confirm `src/components/ui/chart.tsx` exists and exports `ChartContainer`, `ChartTooltip`, `ChartTooltipContent` (open the file to confirm export names; if they differ, note the actual names for Task 5).

- [ ] **Step 3: Commit**

```bash
git -C /d/Code/patungan add src/components/ui/chart.tsx package.json pnpm-lock.yaml
git -C /d/Code/patungan commit -m "chore: add shadcn chart component (recharts)"
```

---

### Task 5: UI — SpendAnalysis client component

**Files:**
- Create: `src/components/spend-analysis.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/spend-analysis.tsx
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ChartColumn } from "lucide-react";
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { formatIDR } from "@/domain/money";
import type { MonthlySpending } from "@/domain/analytics";

function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, 1));
}

const chartConfig = {
  amount: { label: "Pengeluaran" },
} satisfies ChartConfig;

export function SpendAnalysis({ months }: { months: MonthlySpending[] }) {
  // months[0] is the newest. index 0 = newest.
  const [index, setIndex] = useState(0);

  if (months.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold">Analisis Pengeluaran</h1>
        <EmptyState
          icon={ChartColumn}
          title="Belum ada data"
          description="Bikin sesi dan assign item ke orang dulu, nanti pengeluaran bulanan muncul di sini."
        />
      </div>
    );
  }

  const month = months[index];
  const data = month.perPerson.map((p) => ({
    name: p.name,
    amount: p.amount,
    color: p.color,
    share: p.share,
  }));

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold">Analisis Pengeluaran</h1>

      {/* Month selector */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Bulan sebelumnya"
          disabled={index >= months.length - 1}
          onClick={() => setIndex((i) => Math.min(i + 1, months.length - 1))}
        >
          <ChevronLeft />
        </Button>
        <span className="font-semibold">{monthLabel(month.monthKey)}</span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Bulan berikutnya"
          disabled={index <= 0}
          onClick={() => setIndex((i) => Math.max(i - 1, 0))}
        >
          <ChevronRight />
        </Button>
      </div>

      <Card>
        <CardContent className="py-5">
          <p className="text-muted-foreground text-sm">Total pengeluaran</p>
          <p className="text-2xl font-bold">{formatIDR(month.total)}</p>

          {data.length === 0 ? (
            <p className="text-muted-foreground mt-4 text-sm">
              Belum ada item yang ke-assign di bulan ini.
            </p>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="mt-4 w-full"
              style={{ height: `${Math.max(data.length * 44, 88)}px` }}
            >
              <BarChart
                accessibilityLayer
                data={data}
                layout="vertical"
                margin={{ left: 4, right: 56, top: 4, bottom: 4 }}
              >
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={72}
                  tick={{ fontSize: 12 }}
                />
                <XAxis type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatIDR(Number(value))}
                    />
                  }
                />
                <Bar dataKey="amount" radius={6}>
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                  <LabelList
                    dataKey="amount"
                    position="right"
                    className="fill-foreground"
                    fontSize={11}
                    formatter={(value: number) => formatIDR(value)}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

> If Task 4 reported different export names from `chart.tsx`, adjust the imports here accordingly.

- [ ] **Step 2: Typecheck**

Run: `pnpm -C /d/Code/patungan exec tsc --noEmit`
Expected: exit 0. (If `LabelList`/tooltip `formatter` types complain, cast the formatter arg or use `(value: unknown) => formatIDR(Number(value))`.)

- [ ] **Step 3: Commit**

```bash
git -C /d/Code/patungan add src/components/spend-analysis.tsx
git -C /d/Code/patungan commit -m "feat: add SpendAnalysis chart component"
```

---

### Task 6: Route page + loading skeleton

**Files:**
- Create: `src/app/(app)/analysis/page.tsx`
- Create: `src/app/(app)/analysis/loading.tsx`

- [ ] **Step 1: Page**

```tsx
// src/app/(app)/analysis/page.tsx
import { requireUser } from "@/lib/dal";
import { getMonthlySpending } from "@/lib/analytics-view";
import { SpendAnalysis } from "@/components/spend-analysis";

export default async function AnalysisPage() {
  const user = await requireUser();
  const months = await getMonthlySpending(user.id);
  return <SpendAnalysis months={months} />;
}
```

- [ ] **Step 2: Loading skeleton**

```tsx
// src/app/(app)/analysis/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function AnalysisLoading() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-6 w-48" />
      <div className="flex items-center justify-between">
        <Skeleton className="size-7 rounded-md" />
        <Skeleton className="h-5 w-28" />
        <Skeleton className="size-7 rounded-md" />
      </div>
      <Card>
        <CardContent className="space-y-3 py-5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-7 w-40" />
          <div className="space-y-2 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm -C /d/Code/patungan exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git -C /d/Code/patungan add "src/app/(app)/analysis/page.tsx" "src/app/(app)/analysis/loading.tsx"
git -C /d/Code/patungan commit -m "feat: add /analysis route and loading skeleton"
```

---

### Task 7: Add nav item

**Files:**
- Modify: `src/components/app-nav.tsx`

- [ ] **Step 1: Update imports and ITEMS**

Change the lucide import line to include `ChartColumn`:

```tsx
import { Home, Users, ReceiptText, ChartColumn } from "lucide-react";
```

Replace the `ITEMS` array with:

```tsx
const ITEMS = [
  { href: "/dashboard", label: "Beranda", icon: Home },
  { href: "/sessions", label: "Sesi", icon: ReceiptText },
  { href: "/analysis", label: "Analisis", icon: ChartColumn },
  { href: "/friends", label: "Teman", icon: Users },
];
```

- [ ] **Step 2: Typecheck**

Run: `pnpm -C /d/Code/patungan exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git -C /d/Code/patungan add src/components/app-nav.tsx
git -C /d/Code/patungan commit -m "feat: add Analisis tab to bottom nav"
```

---

### Task 8: Full verification

- [ ] **Step 1: Run all unit tests**

Run: `pnpm -C /d/Code/patungan test`
Expected: all tests pass (existing 16 + 6 new analytics).

- [ ] **Step 2: Build (clean cache to avoid the known stale-`.next` font resolve bug)**

Run: `rm -rf /d/Code/patungan/.next && pnpm -C /d/Code/patungan build`
Expected: build succeeds; route list includes `ƒ /analysis`.

- [ ] **Step 3: Manual smoke (optional but recommended)**

Run `pnpm -C /d/Code/patungan start`, log in, open `/analysis`: verify month selector arrows (disabled at ends), total matches, bars colored per avatar, label shows formatted rupiah. With no sessions → empty state.

---

## Self-Review Notes

- **Spec coverage:** metric=owed (Task 3), all participants (Task 3 loops every participant), month from session.date (Task 3 `monthKeyOf`), month selector + ranking layout (Task 5), Recharts (Tasks 4–5), nav item (Task 7), loading skeleton (Task 6), empty state (Task 5), unit tests (Task 1). ✔
- **Aggregation by friendId:** Task 1 keys by friendId; Task 3 feeds `p.friendId`. ✔
- **Type consistency:** `SpendRecord`/`MonthlySpending`/`PersonSpend` defined in Task 1, consumed unchanged in Tasks 3 & 5. `getAllSessionViews` (Task 2) used in Task 3. ✔
- **Known risk:** generated `chart.tsx` export names — Task 4 Step 2 verifies; Task 5 notes the fallback.
