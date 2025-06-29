
"use client"

import * as React from "react"
import { format, startOfMonth, parse } from "date-fns"
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

const generateColor = (index: number) => {
  const hue = (index * 137.508) % 360
  return `hsl(${hue}, 70%, 50%)`
}

export function StackedAreaChartWidget({
  expenses,
}: StackedAreaChartWidgetProps) {
  const { categories } = useSettings()

  const { data, chartConfig } = React.useMemo(() => {
    if (!categories) return { data: [], chartConfig: {} }

    const monthlyData: Record<string, Record<string, number | string>> = {}

    expenses.forEach((expense) => {
      if (expense.amount <= 0) return // Only consider expenses

      const month = format(startOfMonth(new Date(expense.date)), "yyyy-MM")
      if (!monthlyData[month]) {
        monthlyData[month] = { month }
      }
      monthlyData[month][expense.category] =
        ((monthlyData[month][expense.category] as number) || 0) + expense.amount
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

    const config: ChartConfig = categories.reduce((acc, category, index) => {
      acc[category.value] = {
        label: category.label,
        color: generateColor(index),
      }
      return acc
    }, {} as ChartConfig)

    return { data: chartData, chartConfig: config }
  }, [expenses, categories])

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
          verticalAlign="top"
          content={<ChartLegendContent />}
          wrapperStyle={{ paddingTop: 16 }}
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
          />
        ))}
      </AreaChart>
    </ChartContainer>
  )
}
