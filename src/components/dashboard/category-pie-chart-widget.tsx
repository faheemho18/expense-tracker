
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
import { useIsMobile } from "@/hooks/use-mobile"
import { ChartZoomWrapper } from "@/components/ui/chart-zoom-wrapper"

interface CategoryPieChartWidgetProps {
  expenses: Expense[]
}

export function CategoryPieChartWidget({
  expenses,
}: CategoryPieChartWidgetProps) {
  const { categories } = useSettings()
  const isMobile = useIsMobile()
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
    <ChartZoomWrapper className="h-full w-full">
      <ChartContainer config={chartConfig} className={cn(
        "h-full w-full",
        isMobile ? "p-2" : "p-5" // Smaller padding on mobile
      )}>
        <div className={cn(
          "flex h-full w-full gap-4",
          isMobile ? "flex-col" : "flex-row" // Stack vertically on mobile
        )}>
          <div className={cn(
            "min-h-0",
            isMobile ? "h-2/3 w-full" : "flex-1" // Take 2/3 height on mobile
          )}>
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
                  innerRadius={isMobile ? "50%" : "60%"} // Smaller inner radius on mobile
                  strokeWidth={isMobile ? 3 : 5} // Thinner stroke on mobile
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
          <div className={cn(
            "flex justify-center overflow-y-auto",
            isMobile 
              ? "h-1/3 w-full flex-row flex-wrap gap-2 pt-2" // Horizontal layout on mobile
              : "h-full max-h-full w-40 flex-col border-l pl-4" // Vertical layout on desktop
          )}>
            <ChartLegendContent
              payload={legendPayload as any}
              onItemClick={handleLegendClick}
              inactiveKeys={inactiveCategories}
              className={cn(
                isMobile 
                  ? "flex-row flex-wrap items-center gap-2" // Horizontal wrap on mobile
                  : "flex-col items-start" // Vertical stack on desktop
              )}
            />
          </div>
        </div>
      </ChartContainer>
    </ChartZoomWrapper>
  )
}
