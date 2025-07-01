
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

interface AccountTypePieChartWidgetProps {
  expenses: Expense[]
}

const generateColor = (index: number) => {
  const hue = (index * 137.508) % 360 // Use golden angle approximation
  return `hsl(${hue}, 50%, 60%)`
}

export function AccountTypePieChartWidget({
  expenses,
}: AccountTypePieChartWidgetProps) {
  const { accountTypes } = useSettings()
  const [inactiveAccountTypes, setInactiveAccountTypes] = React.useState<
    string[]
  >([])

  const data = React.useMemo(() => {
    const accountTypeTotals = expenses.reduce(
      (acc, expense) => {
        if (expense.amount > 0) {
          acc[expense.accountType] =
            (acc[expense.accountType] || 0) + expense.amount
        }
        return acc
      },
      {} as Record<string, number>
    )

    return Object.entries(accountTypeTotals)
      .map(([accountTypeValue, total]) => ({
        accountType:
          (accountTypes || []).find((a) => a.value === accountTypeValue)
            ?.label || "Unknown",
        total,
        fill: "var(--color-primary)",
      }))
      .sort((a, b) => b.total - a.total)
  }, [expenses, accountTypes])

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {}
    data.forEach((item, index) => {
      config[item.accountType] = {
        label: item.accountType,
        color: generateColor(index),
      }
    })
    return config
  }, [data])

  const handleLegendClick = (item: any) => {
    const accountType = item.value
    setInactiveAccountTypes((prev) =>
      prev.includes(accountType)
        ? prev.filter((c) => c !== accountType)
        : [...prev, accountType]
    )
  }

  if (!accountTypes) {
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
          content={<ChartTooltipContent hideLabel nameKey="accountType" />}
        />
        <Pie
          data={data}
          dataKey="total"
          nameKey="accountType"
          innerRadius="60%"
          outerRadius="80%"
          strokeWidth={5}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                chartConfig[entry.accountType]?.color || generateColor(index)
              }
              className={cn(
                "transition-opacity",
                inactiveAccountTypes.includes(entry.accountType)
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
              nameKey="accountType"
              onItemClick={handleLegendClick}
              inactiveKeys={inactiveAccountTypes}
            />
          }
        />
      </PieChart>
    </ChartContainer>
  )
}
