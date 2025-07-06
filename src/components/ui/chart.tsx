
"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"
import { useViewport, getResponsiveChartConfig, type ViewportInfo } from "@/hooks/use-viewport"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

export type ChartComplexity = 'minimal' | 'standard' | 'enhanced'

export interface ResponsiveChartConfig {
  complexity: ChartComplexity
  showLegend: boolean
  showGrid: boolean
  fontSize: number
  margin: { top: number; right: number; bottom: number; left: number }
  maxDataPoints: number
  animationDuration: number
}

type ChartContextProps = {
  config: ChartConfig
  viewport: ViewportInfo
  responsiveConfig: ResponsiveChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

/**
 * Hook to get viewport-aware chart configuration
 * Provides responsive settings for chart components
 */
export function useChartResponsive() {
  const { viewport, responsiveConfig } = useChart()
  
  return {
    viewport,
    responsiveConfig,
    // Helper methods for common responsive patterns
    shouldShowLegend: responsiveConfig.showLegend,
    shouldShowGrid: responsiveConfig.showGrid,
    getMargin: () => responsiveConfig.margin,
    getFontSize: () => responsiveConfig.fontSize,
    getAnimationDuration: () => responsiveConfig.animationDuration,
    getMaxDataPoints: () => responsiveConfig.maxDataPoints,
    // Viewport checks
    isMobile: viewport.isMobile,
    isTablet: viewport.isTablet,
    isDesktop: viewport.isDesktop,
    isTouchDevice: viewport.isTouchDevice,
  }
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    aspectRatio?: number
    minHeight?: number
    maxHeight?: number
    complexity?: ChartComplexity
  }
>(({ id, className, children, config, aspectRatio, minHeight = 200, maxHeight, complexity, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = React.useState({ width: 0, height: 0 })
  
  // Get viewport information for responsive chart rendering
  const viewport = useViewport()
  const baseResponsiveConfig = getResponsiveChartConfig(viewport)
  
  // Create responsive configuration based on viewport and complexity override
  const responsiveConfig: ResponsiveChartConfig = React.useMemo(() => {
    // Determine complexity based on viewport and explicit prop
    const autoComplexity: ChartComplexity = viewport.isMobile 
      ? 'minimal' 
      : viewport.isTablet 
      ? 'standard' 
      : 'enhanced'
    
    const finalComplexity = complexity || autoComplexity
    
    return {
      complexity: finalComplexity,
      showLegend: finalComplexity !== 'minimal',
      showGrid: finalComplexity === 'enhanced' || (finalComplexity === 'standard' && !viewport.isMobile),
      fontSize: baseResponsiveConfig.fontSize,
      margin: baseResponsiveConfig.margin,
      maxDataPoints: baseResponsiveConfig.maxDataPoints,
      animationDuration: baseResponsiveConfig.animationDuration,
    }
  }, [viewport, complexity, baseResponsiveConfig])

  // Use ResizeObserver to track container size changes
  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateSize = () => {
      const { width, height } = container.getBoundingClientRect()
      setContainerSize({ width, height })
    }

    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(container)
    updateSize() // Initial size

    return () => resizeObserver.disconnect()
  }, [])

  // Calculate responsive height based on aspect ratio and constraints
  const responsiveHeight = React.useMemo(() => {
    if (!containerSize.width) return minHeight

    let calculatedHeight = minHeight

    // Apply aspect ratio if specified
    if (aspectRatio) {
      calculatedHeight = containerSize.width / aspectRatio
    }

    // Apply min/max constraints
    calculatedHeight = Math.max(calculatedHeight, minHeight)
    if (maxHeight) {
      calculatedHeight = Math.min(calculatedHeight, maxHeight)
    }

    return calculatedHeight
  }, [containerSize.width, aspectRatio, minHeight, maxHeight])

  // Combine refs to track both container size and forward ref
  const combinedRef = React.useCallback((node: HTMLDivElement) => {
    // Update our internal ref for ResizeObserver
    ;(containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node
    
    // Forward to the external ref if provided
    if (ref) {
      if (typeof ref === 'function') ref(node)
      else if (ref.current !== undefined) ref.current = node
    }
  }, [ref])

  return (
    <ChartContext.Provider value={{ config, viewport, responsiveConfig }}>
      <div
        data-chart={chartId}
        ref={combinedRef}
        className={cn(
          "w-full overflow-hidden", // Ensure proper containment
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          // Viewport-aware responsive text sizing
          viewport.isMobile && "[&_.recharts-text]:text-xs [&_.recharts-cartesian-axis-tick_text]:text-xs",
          viewport.isTablet && "[&_.recharts-text]:text-sm [&_.recharts-cartesian-axis-tick_text]:text-sm",
          viewport.isDesktop && "[&_.recharts-text]:text-sm [&_.recharts-cartesian-axis-tick_text]:text-sm",
          className
        )}
        style={{
          height: aspectRatio ? responsiveHeight : undefined,
          minHeight: minHeight,
          maxHeight: maxHeight,
          ...props.style
        }}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        {children}
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: "line" | "dot" | "dashed"
      nameKey?: string
      labelKey?: string
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item.dataKey || item.name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload.fill || item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            }
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center"
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltip"

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean
      nameKey?: string
      onItemClick?: (item: any) => void
      inactiveKeys?: string[]
    }
>(
  (
    {
      className,
      hideIcon = false,
      payload,
      verticalAlign = "bottom",
      nameKey,
      onItemClick,
      inactiveKeys,
    },
    ref
  ) => {
    const { config, viewport, responsiveConfig } = useChart()
    
    // Auto-hide legend on mobile for minimal complexity
    const shouldShowLegend = responsiveConfig.showLegend

    if (!payload?.length || !shouldShowLegend) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-wrap items-center justify-center",
          // Responsive gap sizing
          viewport.isMobile ? "gap-x-2 gap-y-1" : "gap-x-4 gap-y-2",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)
          const isInactive = inactiveKeys?.includes(item.value)

          return (
            <div
              key={item.value}
              role="button"
              tabIndex={onItemClick ? 0 : -1}
              onClick={() => onItemClick?.(item)}
              onKeyDown={(e) => {
                if (onItemClick && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault()
                  onItemClick(item)
                }
              }}
              className={cn(
                "flex items-center transition-opacity [&>svg]:text-muted-foreground",
                // Responsive sizing
                viewport.isMobile 
                  ? "gap-1 text-xs [&>svg]:h-2.5 [&>svg]:w-2.5" 
                  : "gap-1.5 text-xs [&>svg]:h-3 [&>svg]:w-3",
                onItemClick ? "cursor-pointer" : "",
                isInactive ? "opacity-50" : "opacity-100"
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className={cn(
                    "shrink-0 rounded-[2px]",
                    viewport.isMobile ? "h-1.5 w-1.5" : "h-2 w-2"
                  )}
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegend"

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  useChartResponsive,
}
