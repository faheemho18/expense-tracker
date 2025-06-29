"use client"

import * as React from "react"
import { Pie, PieChart, Cell, Tooltip } from "recharts"

import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { CATEGORIES } from "@/lib/constants"
import type { Expense } from "@/lib/types"

interface CategoryPieChartWidgetProps {
  expenses: Expense[]
}

const generateColor = (index: number) => {
  const hue = (index * 137.508) % 360 // Use golden angle approximation
  return `hsl(${hue}, 50%, 60%)`
}

export function CategoryPieChartWidget({ expenses }: CategoryPieChartWidgetProps) {
  const data = React.useMemo(() => {
    const categoryTotals = expenses.reduce((acc, expense) => {
      // Only include actual expenses, not refunds/rebates
      if (expense.amount > 0) {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      }
      return acc
    }, {} as Record<string, number>)

    return Object.entries(categoryTotals)
      .map(([categoryValue, total]) => ({
        category: CATEGORIES.find((c) => c.value === categoryValue)?.label || "Unknown",
        total,
        fill: "var(--color-primary)", // Default fill, will be overridden by Cell
      }))
      .sort((a, b) => b.total - a.total)
  }, [expenses])

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {}
    data.forEach((item, index) => {
      config[item.category] = {
        label: item.category,
        color: generateColor(index),
      }
    })
    return config
  }, [data])

  if (data.length === 0) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">No expense data to display.</div>
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
            <Cell
              key={`cell-${index}`}
              fill={chartConfig[entry.category]?.color || generateColor(index)}
            />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
