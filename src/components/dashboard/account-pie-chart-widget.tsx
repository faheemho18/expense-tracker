
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

interface AccountPieChartWidgetProps {
  expenses: Expense[]
}

const generateColor = (index: number) => {
  const hue = (index * 137.508) % 360 // Use golden angle approximation
  return `hsl(${hue}, 50%, 60%)`
}

export function AccountPieChartWidget({
  expenses,
}: AccountPieChartWidgetProps) {
  const { accounts } = useSettings()
  const [inactiveAccounts, setInactiveAccounts] = React.useState<
    string[]
  >([])

  const data = React.useMemo(() => {
    const accountTotals = expenses.reduce(
      (acc, expense) => {
        if (expense.amount > 0) {
          acc[expense.accountTypeId] =
            (acc[expense.accountTypeId] || 0) + expense.amount
        }
        return acc
      },
      {} as Record<string, number>
    )

    return Object.entries(accountTotals)
      .map(([accountValue, total]) => ({
        account:
          (accounts || []).find((a) => a.value === accountValue)
            ?.label || "Unknown",
        total,
        fill: "var(--color-primary)",
      }))
      .sort((a, b) => b.total - a.total)
  }, [expenses, accounts])

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {}
    data.forEach((item, index) => {
      config[item.account] = {
        label: item.account,
        color: generateColor(index),
      }
    })
    return config
  }, [data])

  const handleLegendClick = (item: any) => {
    const account = item.value
    setInactiveAccounts((prev) =>
      prev.includes(account)
        ? prev.filter((c) => c !== account)
        : [...prev, account]
    )
  }

  const legendPayload = React.useMemo<LegendPayload[]>(() => {
    return data.map((entry, index) => ({
      value: entry.account,
      type: "square",
      id: entry.account,
      color: chartConfig[entry.account]?.color || generateColor(index),
    }))
  }, [data, chartConfig])

  if (!accounts) {
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
                content={<ChartTooltipContent hideLabel nameKey="account" />}
              />
              <Pie
                data={data}
                dataKey="total"
                nameKey="account"
                innerRadius="60%"
                strokeWidth={5}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      chartConfig[entry.account]?.color ||
                      generateColor(index)
                    }
                    className={cn(
                      "transition-opacity",
                      inactiveAccounts.includes(entry.account)
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
            inactiveKeys={inactiveAccounts}
            className="flex-col items-start"
          />
        </div>
      </div>
    </ChartContainer>
  )
}
