
"use client"

import * as React from "react"
import type { LegendPayload } from "recharts"
import * as RechartsPrimitive from "recharts"
import { Cell, Pie, PieChart, Tooltip } from "recharts"

import type { Expense } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  ChartContainer,
  type ChartConfig,
  ChartLegendContent,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface AccountPieChartWidgetProps {
  expenses: Expense[]
}

export function AccountPieChartWidget({
  expenses,
}: AccountPieChartWidgetProps) {
  const [inactiveOwners, setInactiveOwners] = React.useState<string[]>([])

  const data = React.useMemo(() => {
    const ownerTotals = expenses.reduce(
      (acc, expense) => {
        if (expense.amount > 0) {
          const owner = expense.accountOwner
          acc[owner] = (acc[owner] || 0) + expense.amount
        }
        return acc
      },
      {} as Record<string, number>
    )

    return Object.entries(ownerTotals)
      .map(([owner, total]) => ({
        owner,
        total,
      }))
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total)
  }, [expenses])

  const chartConfig = React.useMemo(() => {
    return {
      Fayim: {
        label: "Fayim",
        color: "hsl(var(--chart-1))",
      },
      Nining: {
        label: "Nining",
        color: "hsl(var(--chart-2))",
      },
      Conjugal: {
        label: "Conjugal",
        color: "hsl(var(--chart-3))",
      },
    } satisfies ChartConfig
  }, [])

  const handleLegendClick = (item: any) => {
    const owner = item.value
    setInactiveOwners((prev) =>
      prev.includes(owner)
        ? prev.filter((c) => c !== owner)
        : [...prev, owner]
    )
  }

  const legendPayload = React.useMemo<LegendPayload[]>(() => {
    return data.map((entry) => ({
      value: entry.owner,
      type: "square",
      id: entry.owner,
      color: chartConfig[entry.owner as keyof typeof chartConfig]?.color,
    }))
  }, [data, chartConfig])

  if (data.length === 0 || data.every((d) => d.total === 0)) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No expense data to display.
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-full w-full p-5">
      <div className="flex h-full w-full flex-row gap-4">
        <div className="min-h-0 flex-1">
          <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel nameKey="owner" />}
              />
              <Pie
                data={data}
                dataKey="total"
                nameKey="owner"
                innerRadius="60%"
                strokeWidth={5}
              >
                {data.map((entry) => (
                  <Cell
                    key={`cell-${entry.owner}`}
                    fill={
                      chartConfig[entry.owner as keyof typeof chartConfig]?.color
                    }
                    className={cn(
                      "transition-opacity",
                      inactiveOwners.includes(entry.owner)
                        ? "opacity-30"
                        : "opacity-100"
                    )}
                  />
                ))}
              </Pie>
            </PieChart>
          </RechartsPrimitive.ResponsiveContainer>
        </div>
        <div className="flex h-full max-h-full w-40 flex-col justify-center overflow-y-auto border-l pl-4">
          <ChartLegendContent
            payload={legendPayload as any}
            onItemClick={handleLegendClick}
            inactiveKeys={inactiveOwners}
            className="flex-col items-start"
          />
        </div>
      </div>
    </ChartContainer>
  )
}
