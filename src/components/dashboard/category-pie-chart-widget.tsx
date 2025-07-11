
"use client"

import * as React from "react"
// Note: LegendPayload is not exported from recharts v2.15+
type LegendPayload = {
  value: string
  type?: string
  id?: string
  color?: string
}
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
import { useViewport } from "@/hooks/use-viewport"
import { useChartWidgetLazyLoad } from "@/hooks/use-lazy-chart"
// Temporarily disabled for debugging
// import { ChartZoomWrapper } from "./chart-zoom-wrapper"
import { 
  getPieChartConfig, 
  getAnimationConfig,
  ChartPerformanceOptimizer,
  ChartDataProcessor,
  ChartProgressiveEnhancement
} from "@/lib/chart-configs"

interface CategoryPieChartWidgetProps {
  expenses: Expense[]
}

export function CategoryPieChartWidget({
  expenses,
}: CategoryPieChartWidgetProps) {
  const { categories } = useSettings()
  const isMobile = useIsMobile()
  const viewport = useViewport()
  const [inactiveCategories, setInactiveCategories] = React.useState<string[]>([])
  
  // Lazy loading for performance optimization
  const { ref: lazyRef, shouldLoad } = useChartWidgetLazyLoad<HTMLDivElement>('medium')
  
  // Use ResizeObserver for responsive chart sizing
  const { ref: containerRef, width: containerWidth, height: containerHeight } = useResizeObserver<HTMLDivElement>({
    debounceMs: ChartPerformanceOptimizer.getDebouncedResizeHandler(() => {}, 150)?.length || 150,
    triggerOnMount: true,
  })
  
  // Performance monitoring
  const performanceMonitor = React.useMemo(
    () => ChartPerformanceOptimizer.createPerformanceMonitor('category-pie-chart'),
    []
  )

  const { data, chartConfig } = React.useMemo(() => {
    performanceMonitor.startRender()
    
    if (!categories) {
      performanceMonitor.endRender()
      return { data: [], chartConfig: {} }
    }

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

    let chartData = Object.entries(categoryTotals)
      .map(([categoryValue, total]) => {
        const category = categories.find((c) => c.value === categoryValue)
        return {
          category: category?.label || "Unknown",
          name: category?.label || "Unknown", // Add name field for data processing
          total,
          value: total, // Add value field for data processing
          fill: category?.color || "#8884d8", // Fallback color
        }
      })
      .sort((a, b) => b.total - a.total)

    // Apply performance optimizations for mobile
    if (viewport.isMobile || viewport.isTablet) {
      chartData = ChartDataProcessor.simplifyPieData(chartData, viewport)
    }

    const config = chartData.reduce((acc, item) => {
      acc[item.category] = {
        label: item.category,
        color: item.fill,
      }
      return acc
    }, {} as ChartConfig)

    performanceMonitor.endRender()
    return { data: chartData, chartConfig: config }
  }, [expenses, categories, viewport, performanceMonitor])

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

  // Get responsive chart configuration with performance optimizations
  const responsiveConfig = React.useMemo(() => {
    const baseConfig = getPieChartConfig(containerWidth || (isMobile ? 400 : 800))
    const animationConfig = getAnimationConfig(containerWidth || (isMobile ? 400 : 800))
    const performanceOptions = ChartPerformanceOptimizer.getPerformanceRenderOptions(viewport)
    const progressiveFeatures = ChartProgressiveEnhancement.getProgressiveFeatures(viewport)
    
    // Apply mobile optimizations if needed
    const optimizedConfig = viewport.isMobile 
      ? ChartPerformanceOptimizer.optimizeForMobile(baseConfig)
      : baseConfig
    
    // Calculate layout based on container dimensions
    const aspectRatio = containerWidth && containerHeight ? containerWidth / containerHeight : 1
    const isWideContainer = aspectRatio > 1.5
    
    // Determine legend layout
    const legendStyle = (isMobile || isWideContainer) ? "horizontal" : "vertical"
    
    return {
      ...optimizedConfig,
      ...animationConfig,
      legendStyle,
      containerWidth: containerWidth || 0,
      containerHeight: containerHeight || 0,
      // Performance optimizations
      animationDuration: performanceOptions.enableAnimations ? animationConfig.animationDuration : 0,
      enableAnimations: performanceOptions.enableAnimations,
      enableGradients: progressiveFeatures.gradients,
      enableShadows: progressiveFeatures.shadows,
      touchOptimized: performanceOptions.touchOptimized,
    }
  }, [containerWidth, containerHeight, isMobile, viewport])

  if (!categories) {
    return <Skeleton className="h-full w-full" />
  }

  // Early return for loading state
  if (!shouldLoad) {
    return (
      <div ref={lazyRef} className="h-full w-full flex items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No expense data to display.
      </div>
    )
  }

  return (
    // Temporarily disabled ChartZoomWrapper for debugging
    // <ChartZoomWrapper className="h-full w-full">
    <div className="h-full w-full">
      <div 
        ref={(el) => {
          // Combine refs for lazy loading and resize observer
          if (el) {
            // Use type assertion to work around readonly ref issue
            (lazyRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
            (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          }
        }} 
        className="h-full w-full"
      >
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
                    animationBegin={responsiveConfig.enableAnimations ? responsiveConfig.animationBegin : 0}
                    animationDuration={responsiveConfig.animationDuration}
                    isAnimationActive={responsiveConfig.animationDuration > 0}
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
      {/* Temporarily disabled ChartZoomWrapper for debugging */}
      {/* </ChartZoomWrapper> */}
    </div>
  )
}
