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
                    formatter={(value: unknown) => formatIDR(Number(value))}
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
