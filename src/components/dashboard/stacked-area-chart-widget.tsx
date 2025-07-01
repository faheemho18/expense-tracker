
"use client"

import * as React from "react"
import { format, startOfMonth, parse } from "date-fns"
import * as RechartsPrimitive from "recharts"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useSettings } from "@/contexts/settings-context"
import type { Expense } from "@/lib/types"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"

interface StackedAreaChartWidgetProps {
  expenses: Expense[]
}

export function StackedAreaChartWidget({
  expenses,
}: StackedAreaChartWidgetProps) {
  const { categories } = useSettings()
  const [hiddenSeries, setHiddenSeries] = React.useState<string[]>([])

  const { data, chartConfig } = React.useMemo(() => {
    if (!categories) return { data: [], chartConfig: {} }

    const config: ChartConfig = categories.reduce((acc, category) => {
      acc[category.value] = {
        label: category.label,
        color: category.color,
      }
      return acc
    }, {} as ChartConfig)

    const monthlyData: Record<string, Record<string, number | string>> = {}

    expenses.forEach((expense) => {
      if (expense.amount <= 0) return // Only consider expenses

      const month = format(startOfMonth(new Date(expense.date)), "yyyy-MM")
      if (!monthlyData[month]) {
        monthlyData[month] = { month }
        Object.keys(config).forEach((categoryKey) => {
          monthlyData[month][categoryKey] = 0
        })
      }
      if (config[expense.category]) {
        monthlyData[month][expense.category] =
          ((monthlyData[month][expense.category] as number) || 0) +
          expense.amount
      }
    })

    const chartData = Object.values(monthlyData)
      .map((d) => ({
        ...d,
        month: format(parse(d.month as string, "yyyy-MM", new Date()), "MMM yy"),
      }))
      .sort((a, b) => {
        const dateA = parse(a.month, "MMM yy", new Date())
        const dateB = parse(b.month, "MMM yy", new Date())
        return dateA.getTime() - dateB.getTime()
      })

    return { data: chartData, chartConfig: config }
  }, [expenses, categories])

  const handleLegendClick = (item: any) => {
    const key = item.value
    setHiddenSeries((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
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
    <ChartContainer config={chartConfig} className="h-full w-full">
      <RechartsPrimitive.ResponsiveContainer>
        <AreaChart
          accessibilityLayer
          data={data}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => value}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => formatCurrency(Number(value), "compact")}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <ChartLegend
            align="center"
            verticalAlign="bottom"
            content={
              <ChartLegendContent
                onItemClick={handleLegendClick}
                inactiveKeys={hiddenSeries}
              />
            }
            wrapperStyle={{ paddingTop: 24 }}
          />
          {Object.keys(chartConfig).map((key) => (
            <Area
              key={key}
              dataKey={key}
              type="natural"
              fill={`var(--color-${key})`}
              fillOpacity={0.4}
              stroke={`var(--color-${key})`}
              stackId="a"
              hide={hiddenSeries.includes(chartConfig[key].label as string)}
            />
          ))}
        </AreaChart>
      </RechartsPrimitive.ResponsiveContainer>
    </ChartContainer>
  )
}
