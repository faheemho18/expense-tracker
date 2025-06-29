
"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"

import { useSettings } from "@/contexts/settings-context"
import type { Expense } from "@/lib/types"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, getIcon } from "@/lib/utils"

interface CategoryGaugesWidgetProps {
  expenses: Expense[]
}

export function CategoryGaugesWidget({ expenses }: CategoryGaugesWidgetProps) {
  const { categories, categoryThresholds } = useSettings()

  const gaugeData = React.useMemo(() => {
    if (!categories || !categoryThresholds) return []

    const categoryTotals = expenses.reduce(
      (acc, expense) => {
        if (expense.amount > 0) {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount
        }
        return acc
      },
      {} as Record<string, number>
    )

    return categoryThresholds
      .map((threshold) => {
        const category = categories.find(
          (c) => c.value === threshold.categoryValue
        )
        if (!category) return null

        const spent = categoryTotals[threshold.categoryValue] || 0
        const budget = threshold.threshold
        const percentage = budget > 0 ? Math.round((spent / budget) * 100) : 0

        return {
          category,
          spent,
          budget,
          percentage,
          data: [
            { name: "spent", value: spent, fill: "var(--color-spent)" },
            {
              name: "remaining",
              value: Math.max(0, budget - spent),
              fill: "var(--color-remaining)",
            },
          ],
        }
      })
      .filter(Boolean) as {
      category: { value: string; label: string; icon: string }
      spent: number
      budget: number
      percentage: number
      data: { name: string; value: number; fill: string }[]
    }[]
  }, [expenses, categories, categoryThresholds])

  if (!categories || !categoryThresholds) {
    return <Skeleton className="h-full w-full" />
  }

  if (gaugeData.length === 0) {
    return (
      <div className="flex h-full min-h-[150px] items-center justify-center rounded-md border border-dashed text-muted-foreground">
        No budgets set or no expense data for the selected period.
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
        {gaugeData.map((item) => {
          const Icon = getIcon(item.category.icon)
          const chartConfig = {
            spent: { label: "Spent", color: "hsl(var(--primary))" },
            remaining: { label: "Remaining", color: "hsl(var(--muted))" },
          }
          return (
            <div
              key={item.category.value}
              className="flex flex-col items-center gap-2"
            >
              <div className="flex items-center gap-2 text-center">
                <Icon className="h-4 w-4" />
                <span className="font-medium">{item.category.label}</span>
              </div>
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square h-32"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={item.data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={35}
                    outerRadius={45}
                    cornerRadius={99}
                    startAngle={220}
                    endAngle={-40}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-xl font-bold"
                              >
                                {item.percentage.toLocaleString()}%
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="text-xs text-muted-foreground">
                {formatCurrency(item.spent)} of {formatCurrency(item.budget)}
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
