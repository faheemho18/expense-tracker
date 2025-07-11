
"use client"

import * as React from "react"
import { format, getYear, startOfMonth } from "date-fns"
import { BarChart } from "lucide-react"
import { Responsive, WidthProvider, type Layout } from "react-grid-layout"

import type { Account, Expense, WidgetConfig, WidgetFilters } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useIsMobile } from "@/hooks/use-mobile"
import { useSwipeGesture } from "@/hooks/use-touch-gestures"

import { AccountPieChartWidget } from "./account-pie-chart-widget"
import { CategoryPieChartWidget } from "./category-pie-chart-widget"
import { HeatmapCalendarWidget } from "./heatmap-calendar-widget"
import { OverTimeBarChartWidget } from "./over-time-bar-chart-widget"
import { StackedAreaChartWidget } from "./stacked-area-chart-widget"
import { StatsWidget } from "./stats-widget"
import { WidgetWrapper } from "./widget-wrapper"

const ResponsiveGridLayout = WidthProvider(Responsive)

interface DashboardGridProps {
  expenses: Expense[]
  widgets: WidgetConfig[]
  accounts: Account[]
  removeWidget: (id: string) => void
  updateWidgetTitle: (id: string, title: string) => void
  updateWidgetFilters: (id: string, filters: WidgetFilters) => void
  availableMonths: { value: string; label: string }[]
  availableYears: { value: string; label: string }[]
  areGlobalFiltersActive: boolean
  onLayoutChange: (layout: Layout[]) => void
  onWidgetSwipe?: (direction: 'left' | 'right', widgetId: string) => void
}

const renderWidget = (
  widget: WidgetConfig,
  expenses: Expense[],
  accounts: Account[]
) => {
  switch (widget.type) {
    case "stats":
      return <StatsWidget expenses={expenses} />
    case "category-pie":
      return <CategoryPieChartWidget expenses={expenses} />
    case "over-time-bar":
      return <OverTimeBarChartWidget expenses={expenses} />
    case "account-pie":
      return <AccountPieChartWidget expenses={expenses} />
    case "stacked-area":
      return <StackedAreaChartWidget expenses={expenses} />
    case "heatmap-calendar":
      return <HeatmapCalendarWidget expenses={expenses} />
    default:
      return null
  }
}

export function DashboardGrid({
  expenses,
  widgets,
  accounts,
  removeWidget,
  updateWidgetTitle,
  updateWidgetFilters,
  availableMonths,
  availableYears,
  areGlobalFiltersActive,
  onLayoutChange,
  onWidgetSwipe,
}: DashboardGridProps) {
  const isMobile = useIsMobile()
  
  // Handle swipe gestures for widget navigation on mobile
  const swipeRef = React.useRef<HTMLDivElement>(null)
  const swipeGestures = useSwipeGesture(
    React.useCallback((gesture: { direction: 'left' | 'right' | 'up' | 'down'; distance: number; velocity: number }) => {
      if ((gesture.direction === 'left' || gesture.direction === 'right') && isMobile && onWidgetSwipe) {
        // For now, we'll implement basic swipe detection
        // In a more advanced implementation, we could detect which widget is being swiped
        // and pass its ID to the callback
        const currentWidget = widgets[0] // Simplified for demo
        if (currentWidget) {
          onWidgetSwipe(gesture.direction as 'left' | 'right', currentWidget.id)
        }
      }
    }, [isMobile, onWidgetSwipe, widgets]),
    {
      swipeThreshold: 80, // Require longer swipe on mobile
      velocityThreshold: 0.3,
    }
  )
  
  const layouts = React.useMemo(() => {
    if (!widgets) return { lg: [], md: [], sm: [], xs: [], xxs: [] }
    
    const createLayout = (cols: number, isMobileBreakpoint: boolean = false) => {
      let cumulativeY = 0 // Track vertical position for mobile stacking
      
      return widgets.map((widget, index) => {
        const isStats = widget.type === "stats"
        const isPieChart = widget.type === "category-pie" || widget.type === "account-pie"
        
        if (isMobileBreakpoint) {
          // Mobile layouts: full width, optimized heights based on widget type
          let widgetHeight: number
          
          if (isStats) {
            widgetHeight = 3 // Compact stats
          } else if (isPieChart) {
            widgetHeight = 6 // Pie charts need more height for legend
          } else {
            widgetHeight = 5 // Default height for other charts
          }

          const layout = {
            i: widget.id,
            x: 0,
            y: cumulativeY,
            w: cols, // Full width on mobile
            h: widgetHeight,
            minW: cols,
            minH: isStats ? 3 : 4,
            maxH: isStats ? 3 : 8, // Allow more height for complex charts
            isResizable: false, // Disable resizing on mobile for better UX
            static: isMobile, // Make widgets static on mobile to prevent accidental moves
          }
          
          cumulativeY += widgetHeight + 1 // Add spacing between widgets
          return layout
        } else {
          // Desktop layouts: original logic with improvements
          const defaultW = isStats ? 12 : 6
          const defaultH = isStats ? 4 : 6

          return {
            i: widget.id,
            x: widget.x ?? (index % 2) * 6, // Better default positioning
            y: widget.y ?? Math.floor(index / 2) * 6,
            w: widget.w ?? defaultW,
            h: widget.h ?? defaultH,
            minW: isStats ? 12 : 6, // Stats always full width
            minH: isStats ? 3 : 4,
            maxH: isStats ? 4 : 8,
            isResizable: true,
          }
        }
      })
    }

    return {
      lg: createLayout(12, false),  // Desktop: 12 columns
      md: createLayout(10, false),  // Large tablet: 10 columns
      sm: createLayout(6, true),    // Small tablet: 6 columns, mobile-like
      xs: createLayout(4, true),    // Mobile: 4 columns
      xxs: createLayout(2, true),   // Small mobile: 2 columns
    }
  }, [widgets, isMobile])

  if (widgets.length === 0) {
    return (
      <Alert>
        <BarChart className="h-4 w-4" />
        <AlertTitle>Your Dashboard is Empty</AlertTitle>
        <AlertDescription>
          Click the add button to start building your dashboard and gain
          insights into your spending.
        </AlertDescription>
      </Alert>
    )
  }

  const handleLayoutChange = (layout: Layout[]) => {
    onLayoutChange(layout)
  }

  const handleResizeStop = (
    layout: Layout[],
    oldItem: Layout,
    newItem: Layout
  ) => {
    const widget = widgets.find((w) => w.id === newItem.i)
    if (!widget) {
      onLayoutChange(layout)
      return
    }

    // Snap width to 6 or 12. Anything <= 9 snaps to 6.
    const snappedWidth = newItem.w <= 9 ? 6 : 12

    const newLayout = layout.map((l) => {
      if (l.i === newItem.i) {
        return { ...l, w: snappedWidth }
      }
      return l
    })

    onLayoutChange(newLayout)
  }

  // Combine refs for swipe detection
  const combinedRef = React.useCallback((node: HTMLDivElement) => {
    if (swipeRef.current !== node) {
      ;(swipeRef as React.MutableRefObject<HTMLDivElement | null>).current = node
    }
  }, [])

  return (
    <div 
      ref={combinedRef} 
      className="w-full h-full"
      onTouchStart={(e) => swipeGestures.onTouchStart(e.nativeEvent)}
      onTouchEnd={(e) => swipeGestures.onTouchEnd(e.nativeEvent)}
    >
      <ResponsiveGridLayout
      layouts={layouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={isMobile ? 45 : 50} // Optimized row height for mobile
      draggableHandle={isMobile ? ".never-drag" : ".drag-handle"} // Disable dragging on mobile
      isDraggable={!isMobile} // Completely disable dragging on mobile
      isResizable={!isMobile} // Disable resizing on mobile
      onDragStop={handleLayoutChange}
      onResizeStop={handleResizeStop}
      className={cn(
        "w-full", 
        isMobile ? "min-h-[300px] gap-y-2" : "min-h-[500px]"
      )}
      margin={isMobile ? [12, 12] : [16, 16]} // Better spacing on mobile
      containerPadding={isMobile ? [8, 8] : [16, 16]} // Add container padding
      compactType={isMobile ? "vertical" : "vertical"} // Always compact vertically
      preventCollision={false} // Allow items to move around each other
      autoSize={true} // Automatically size container to fit content
    >
      {widgets.map((widget) => {
        const widgetFilters = widget.filters
        const hasWidgetFilters =
          widgetFilters &&
          ((widgetFilters.year?.length ?? 0) > 0 ||
            (widgetFilters.month?.length ?? 0) > 0 ||
            (widgetFilters.category?.length ?? 0) > 0 ||
            (widgetFilters.accountId?.length ?? 0) > 0)

        let widgetExpenses = expenses

        if (
          widget.type === "stats" &&
          !areGlobalFiltersActive &&
          !hasWidgetFilters
        ) {
          const currentYear = new Date().getFullYear()
          widgetExpenses = expenses.filter(
            (e) => new Date(e.date).getFullYear() === currentYear
          )
        } else if (hasWidgetFilters) {
          const {
            year = [],
            month = [],
            category = [],
            accountId = [],
          } = widgetFilters!

          widgetExpenses = expenses.filter((expense) => {
            const expenseDate = new Date(expense.date)
            const expenseYear = getYear(expenseDate).toString()
            const expenseMonth = format(startOfMonth(expenseDate), "yyyy-MM")

            const yearMatch = year.length === 0 || year.includes(expenseYear)
            const monthMatch = month.length === 0 || month.includes(expenseMonth)
            const categoryMatch =
              category.length === 0 || category.includes(expense.category)
            const accountMatch =
              accountId.length === 0 ||
              accountId.includes(expense.accountTypeId)

            return yearMatch && monthMatch && categoryMatch && accountMatch
          })
        }

        return (
          <div key={widget.id}>
            <WidgetWrapper
              widget={widget}
              removeWidget={removeWidget}
              updateWidgetTitle={updateWidgetTitle}
              updateWidgetFilters={updateWidgetFilters}
              availableMonths={availableMonths}
              availableYears={availableYears}
            >
              {renderWidget(widget, widgetExpenses, accounts)}
            </WidgetWrapper>
          </div>
        )
      })}
      </ResponsiveGridLayout>
    </div>
  )
}
