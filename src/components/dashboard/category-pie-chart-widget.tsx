
"use client"

import * as React from "react"
import { Cell, Pie, PieChart, Tooltip } from "recharts"

import { useSettings } from "@/contexts/settings-context"
import type { Expense } from "@/lib/types"
import {
  ChartContainer,
  type ChartConfig,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

export function CategoryPieChartWidget({
  expenses,
}: CategoryPieChartWidgetProps) {
  const { categories } = useSettings()

  const { data, chartConfig } = React.useMemo(() => {
    if (!categories) return { data: [], chartConfig: {} }

    const categoryTotals = expenses.reduce(
      (acc, expense) => {
        // Only include actual expenses, not refunds/rebates
        if (expense.amount > 0) {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount
        }
        return acc
      },
      {} as Record<string, number>
    )

    const chartData = Object.entries(categoryTotals)
      .map(([categoryValue, total]) => {
        const category = categories.find((c) => c.value === categoryValue)
        return {
          category: category?.label || "Unknown",
          total,
          fill: category?.color || "#8884d8", // Fallback color
        }
      })
      .sort((a, b) => b.total - a.total)

    const config = chartData.reduce((acc, item) => {
      acc[item.category] = {
        label: item.category,
        color: item.fill,
      }
      return acc
    }, {} as ChartConfig)

    return { data: chartData, chartConfig: config }
  }, [expenses, categories])

  if (!categories) {
    return <Skeleton className="h-full w-full" />
  }

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No expense data to display.
      </div>
    )
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-full"
    >
      <PieChart>
        <Tooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel nameKey="category" />}
        />
        <Pie
          data={data}
          dataKey="total"
          nameKey="category"
          innerRadius={60}
          strokeWidth={5}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
