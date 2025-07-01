
"use client"

import * as React from "react"
import { format, startOfMonth } from "date-fns"
import * as RechartsPrimitive from "recharts"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import type { Expense } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import {
  ChartContainer,
  type ChartConfig,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface OverTimeBarChartWidgetProps {
  expenses: Expense[]
}

const chartConfig = {
  expenses: {
    label: "Expenses",
    color: "hsl(var(--primary))",
  },
  refunds: {
    label: "Refunds",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig

export function OverTimeBarChartWidget({
  expenses,
}: OverTimeBarChartWidgetProps) {
  const [hiddenSeries, setHiddenSeries] = React.useState<string[]>([])

  const data = React.useMemo(() => {
    const monthlyTotals = expenses.reduce(
      (acc, expense) => {
        const month = format(startOfMonth(new Date(expense.date)), "MMM yyyy")
        if (!acc[month]) {
          acc[month] = { expenses: 0, refunds: 0 }
        }
        if (expense.amount > 0) {
          acc[month].expenses += expense.amount
        } else {
          acc[month].refunds += Math.abs(expense.amount)
        }
        return acc
      },
      {} as Record<string, { expenses: number; refunds: number }>
    )

    return Object.entries(monthlyTotals)
      .map(([month, totals]) => ({ month, ...totals }))
      .sort(
        (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
      )
  }, [expenses])

  const handleLegendClick = (item: any) => {
    const key = item.value
    setHiddenSeries((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No expense data to display.
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-full w-full p-5">
      <RechartsPrimitive.ResponsiveContainer>
        <BarChart data={data} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
          />
          <YAxis tickFormatter={(value) => formatCurrency(value, "compact")} />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <div>
                    {name}: {formatCurrency(Number(value))}
                  </div>
                )}
              />
            }
          />
          <ChartLegend
            verticalAlign="bottom"
            content={
              <ChartLegendContent
                onItemClick={handleLegendClick}
                inactiveKeys={hiddenSeries}
              />
            }
          />
          <Bar
            dataKey="expenses"
            fill="var(--color-expenses)"
            radius={4}
            hide={hiddenSeries.includes(chartConfig.expenses.label as string)}
          />
          <Bar
            dataKey="refunds"
            fill="var(--color-refunds)"
            radius={4}
            hide={hiddenSeries.includes(chartConfig.refunds.label as string)}
          />
        </BarChart>
      </RechartsPrimitive.ResponsiveContainer>
    </ChartContainer>
  )
}
