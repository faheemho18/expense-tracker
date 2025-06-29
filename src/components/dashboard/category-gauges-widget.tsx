
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
  const { categories } = useSettings()

  const gaugeData = React.useMemo(() => {
    if (!categories) return []

    const categoryTotals = expenses.reduce(
      (acc, expense) => {
        if (expense.amount > 0) {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount
        }
        return acc
      },
      {} as Record<string, number>
    )

    return categories.map((category) => {
      const spent = categoryTotals[category.value] || 0
      const budget = category.budget || 0
      const percentage = budget > 0 ? Math.round((spent / budget) * 100) : 0

      const pieData =
        budget > 0
          ? [
              { name: "spent", value: spent, fill: category.color },
              {
                name: "remaining",
                value: Math.max(0, budget - spent),
                fill: "hsl(var(--muted))",
              },
            ]
          : [{ name: "unset", value: 1, fill: "hsl(var(--muted)/0.5)" }]

      return {
        category,
        spent,
        budget,
        percentage,
        data: pieData,
      }
    })
  }, [expenses, categories])

  if (!categories) {
    return <Skeleton className="h-full w-full" />
  }

  if (gaugeData.length === 0) {
    return (
      <div className="flex h-full min-h-[150px] items-center justify-center rounded-md border border-dashed text-muted-foreground">
        No categories defined. Go to Settings to add them.
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
        {gaugeData.map((item) => {
          const Icon = getIcon(item.category.icon)
          const chartConfig = {
            spent: { label: "Spent", color: item.category.color },
            remaining: { label: "Remaining", color: "hsl(var(--muted))" },
            unset: { label: "Unset", color: "hsl(var(--muted))" },
          }
          return (
            <div
              key={item.category.value}
              className="flex flex-col items-center gap-2"
            >
              <div className="flex items-center gap-2 text-center">
                <Icon
                  className="h-4 w-4"
                  color={item.category.color}
                />
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
                    cornerRadius={item.budget > 0 ? 99 : 0}
                    startAngle={item.budget > 0 ? 220 : undefined}
                    endAngle={item.budget > 0 ? -40 : undefined}
                  >
                    {item.budget > 0 && (
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
                    )}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="text-xs text-muted-foreground">
                {item.budget > 0
                  ? `${formatCurrency(item.spent)} of ${formatCurrency(
                      item.budget
                    )}`
                  : "Budget not set"}
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
