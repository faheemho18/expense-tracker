
"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"
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
  sortOrder: "ascending" | "descending" | null
}

export function CategoryGaugesWidget({
  expenses,
  sortOrder,
}: CategoryGaugesWidgetProps) {
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

    const data = categories.map((category) => {
      const spent = categoryTotals[category.value] || 0
      const threshold = category.threshold || 0
      const percentage =
        threshold > 0 ? Math.round((spent / threshold) * 100) : 0

      const pieData =
        threshold > 0
          ? [
              { name: "spent", value: spent, fill: category.color },
              {
                name: "remaining",
                value: Math.max(0, threshold - spent),
                fill: "hsl(var(--muted))",
              },
            ]
          : [{ name: "unset", value: 1, fill: "hsl(var(--muted)/0.5)" }]

      return {
        category,
        spent,
        threshold,
        percentage,
        data: pieData,
      }
    })

    if (sortOrder) {
      data.sort((a, b) => {
        if (sortOrder === "ascending") {
          return a.percentage - b.percentage
        }
        return b.percentage - a.percentage
      })
    }

    return data
  }, [expenses, categories, sortOrder])

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
                <RechartsPrimitive.ResponsiveContainer>
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
                      cornerRadius={item.threshold > 0 ? 99 : 0}
                      startAngle={item.threshold > 0 ? 220 : undefined}
                      endAngle={item.threshold > 0 ? -40 : undefined}
                    >
                      {item.threshold > 0 && (
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
                </RechartsPrimitive.ResponsiveContainer>
              </ChartContainer>
              <div className="text-xs text-muted-foreground">
                {item.threshold > 0
                  ? `${formatCurrency(item.spent)} of ${formatCurrency(
                      item.threshold
                    )}`
                  : "Threshold not set"}
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
