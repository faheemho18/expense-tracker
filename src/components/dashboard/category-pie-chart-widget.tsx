
"use client"

import * as React from "react"
import type { LegendPayload } from "recharts"
import * as RechartsPrimitive from "recharts"
import { Cell, Pie, PieChart, Tooltip } from "recharts"

import { useSettings } from "@/contexts/settings-context"
import type { Expense } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  ChartContainer,
  type ChartConfig,
  ChartLegendContent,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

interface CategoryPieChartWidgetProps {
  expenses: Expense[]
}

export function CategoryPieChartWidget({
  expenses,
}: CategoryPieChartWidgetProps) {
  const { categories } = useSettings()
  const [inactiveCategories, setInactiveCategories] = React.useState<string[]>([])

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

  const handleLegendClick = (item: any) => {
    const category = item.value
    setInactiveCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    )
  }

  const legendPayload = React.useMemo<LegendPayload[]>(() => {
    return data.map((entry) => ({
      value: entry.category,
      type: "square",
      id: entry.category,
      color: entry.fill,
    }))
  }, [data])

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
    <ChartContainer config={chartConfig} className="h-full w-full p-5">
      <div className="flex h-full w-full flex-row gap-4">
        <div className="min-h-0 flex-1">
          <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel nameKey="category" />}
              />
              <Pie
                data={data}
                dataKey="total"
                nameKey="category"
                innerRadius="60%"
                strokeWidth={5}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    className={cn(
                      "transition-opacity",
                      inactiveCategories.includes(entry.category)
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
            inactiveKeys={inactiveCategories}
            className="flex-col items-start"
          />
        </div>
      </div>
    </ChartContainer>
  )
}
