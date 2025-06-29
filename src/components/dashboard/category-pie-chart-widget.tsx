
"use client"

import * as React from "react"
import { Cell, Pie, PieChart, Tooltip } from "recharts"

import { useSettings } from "@/contexts/settings-context"
import type { Expense } from "@/lib/types"
import { cn, formatCurrency } from "@/lib/utils"
import {
  ChartContainer,
  type ChartConfig,
  ChartLegend,
  ChartLegendContent,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

interface CategoryPieChartWidgetProps {
  expenses: Expense[]
}

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
  payload,
}: any) => {
  const RADIAN = Math.PI / 180
  const radius = outerRadius + 20
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  const value = payload.total

  return (
    <text
      x={x}
      y={y}
      className="fill-foreground text-xs"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
    >
      {`${(percent * 100).toFixed(0)}%`}
      <tspan x={x} dy="1.2em">
        {formatCurrency(value, "compact")}
      </tspan>
    </text>
  )
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
      className="mx-auto h-full"
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
          innerRadius="60%"
          outerRadius="80%"
          strokeWidth={5}
          label={renderCustomizedLabel}
          labelLine
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
        <ChartLegend
          verticalAlign="bottom"
          content={
            <ChartLegendContent
              nameKey="category"
              onItemClick={handleLegendClick}
              inactiveKeys={inactiveCategories}
            />
          }
        />
      </PieChart>
    </ChartContainer>
  )
}
