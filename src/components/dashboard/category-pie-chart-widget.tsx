
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
import { useResizeObserver } from "@/hooks/use-resize-observer"
import { ChartZoomWrapper } from "@/components/ui/chart-zoom-wrapper"
import { getPieChartConfig, getAnimationConfig } from "@/lib/chart-configs"

interface CategoryPieChartWidgetProps {
  expenses: Expense[]
}

export function CategoryPieChartWidget({
  expenses,
}: CategoryPieChartWidgetProps) {
  const { categories } = useSettings()
  const isMobile = useIsMobile()
  const [inactiveCategories, setInactiveCategories] = React.useState<string[]>([])
  
  // Use ResizeObserver for responsive chart sizing
  const { ref: containerRef, width: containerWidth, height: containerHeight } = useResizeObserver<HTMLDivElement>({
    debounceMs: 100, // Debounce to avoid excessive re-renders
    triggerOnMount: true,
  })

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

  // Get responsive chart configuration
  const responsiveConfig = React.useMemo(() => {
    const baseConfig = getPieChartConfig(containerWidth || (isMobile ? 400 : 800))
    const animationConfig = getAnimationConfig(containerWidth || (isMobile ? 400 : 800))
    
    // Calculate layout based on container dimensions
    const aspectRatio = containerWidth && containerHeight ? containerWidth / containerHeight : 1
    const isWideContainer = aspectRatio > 1.5
    
    // Determine legend layout
    const legendStyle = (isMobile || isWideContainer) ? "horizontal" : "vertical"
    
    return {
      ...baseConfig,
      ...animationConfig,
      legendStyle,
      containerWidth: containerWidth || 0,
      containerHeight: containerHeight || 0,
    }
  }, [containerWidth, containerHeight, isMobile])

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
      <div ref={containerRef} className="h-full w-full">
        <ChartContainer 
          config={chartConfig} 
          aspectRatio={responsiveConfig.legendStyle === "horizontal" ? 1.5 : 1.2}
          minHeight={responsiveConfig.height as number}
          className={cn(
            "h-full w-full",
            isMobile ? "mobile-spacing" : "desktop-spacing"
          )}
        >
          <div className={cn(
            "flex h-full w-full",
            responsiveConfig.legendStyle === "horizontal" ? "flex-col gap-2" : "flex-row gap-4"
          )}>
            <div className={cn(
              "min-h-0 flex-1",
              responsiveConfig.legendStyle === "horizontal" ? "h-3/4 w-full" : "w-full"
            )}>
              <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
                <PieChart margin={responsiveConfig.margin}>
                  <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel nameKey="category" />}
                  />
                  <Pie
                    data={data}
                    dataKey="total"
                    nameKey="category"
                    innerRadius={responsiveConfig.innerRadius}
                    outerRadius={responsiveConfig.outerRadius}
                    strokeWidth={responsiveConfig.strokeWidth}
                    animationBegin={responsiveConfig.animationBegin}
                    animationDuration={responsiveConfig.animationDuration}
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
              responsiveConfig.legendStyle === "horizontal"
                ? "h-1/4 w-full flex-row flex-wrap gap-2 pt-2"
                : "h-full max-h-full w-40 flex-col border-l pl-4"
            )}>
              <ChartLegendContent
                payload={legendPayload as any}
                onItemClick={handleLegendClick}
                inactiveKeys={inactiveCategories}
                className={cn(
                  responsiveConfig.legendStyle === "horizontal"
                    ? "flex-row flex-wrap items-center gap-2"
                    : "flex-col items-start gap-1"
                )}
                style={{
                  fontSize: `${responsiveConfig.legendFontSize}px`
                }}
              />
            </div>
          </div>
        </ChartContainer>
      </div>
    </ChartZoomWrapper>
  )
}
