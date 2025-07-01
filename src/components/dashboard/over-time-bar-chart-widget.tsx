
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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface OverTimeBarChartWidgetProps {
  expenses: Expense[]
}

const chartConfig = {
  net: {
    label: "Net",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function OverTimeBarChartWidget({
  expenses,
}: OverTimeBarChartWidgetProps) {
  const data = React.useMemo(() => {
    const monthlyTotals = expenses.reduce(
      (acc, expense) => {
        const month = format(startOfMonth(new Date(expense.date)), "MMM yyyy")
        if (!acc[month]) {
          acc[month] = { net: 0 }
        }
        // expense.amount is positive for expenses and negative for refunds
        acc[month].net += expense.amount
        return acc
      },
      {} as Record<string, { net: number }>
    )

    return Object.entries(monthlyTotals)
      .map(([month, totals]) => ({ month, ...totals }))
      .sort(
        (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
      )
  }, [expenses])

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
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar dataKey="net" fill="var(--color-net)" radius={4} />
        </BarChart>
      </RechartsPrimitive.ResponsiveContainer>
    </ChartContainer>
  )
}
