"use client"

import * as React from "react"
import { format, getYear, startOfMonth } from "date-fns"
import { BarChart } from "lucide-react"
import { Responsive, WidthProvider, type Layout } from "react-grid-layout"

import type { Account, Expense, WidgetConfig, WidgetFilters } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useIsMobile } from "@/hooks/use-mobile"

import { AccountPieChartWidget } from "./account-pie-chart-widget"
import { CategoryPieChartWidget } from "./category-pie-chart-widget"
import { HeatmapCalendarWidget } from "./heatmap-calendar-widget"
import { OverTimeBarChartWidget } from "./over-time-bar-chart-widget"
import { StackedAreaChartWidget } from "./stacked-area-chart-widget"
import { StatsWidget } from "./stats-widget"
import { WidgetWrapper } from "./widget-wrapper"

const ResponsiveGridLayout = WidthProvider(Responsive)

interface SimpleDashboardGridProps {
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
}

const renderWidget = (
  widget: WidgetConfig,
  expenses: Expense[],
  accounts: Account[]
) => {
  console.log('🔍 SimpleDashboardGrid: Rendering widget:', widget.type, widget.id)
  
  try {
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
        console.warn('🔍 SimpleDashboardGrid: Unknown widget type:', widget.type)
        return null
    }
  } catch (error) {
    console.error('🚨 SimpleDashboardGrid: Error rendering widget:', widget.type, error)
    return (
      <div className="p-4 text-center text-red-500">
        Error rendering {widget.type} widget
      </div>
    )
  }
}

export function SimpleDashboardGrid({
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
}: SimpleDashboardGridProps) {
  console.log('🔍 SimpleDashboardGrid: Component mounting')
  console.log('🔍 SimpleDashboardGrid: Props received:', {
    expensesCount: expenses?.length,
    widgetsCount: widgets?.length,
    accountsCount: accounts?.length
  })
  
  const isMobile = useIsMobile()
  
  const layouts = React.useMemo(() => {
    console.log('🔍 SimpleDashboardGrid: Computing layouts for widgets:', widgets?.length)
    
    if (!widgets) return { lg: [], md: [], sm: [], xs: [], xxs: [] }
    
    const createLayout = (cols: number, isMobileBreakpoint: boolean = false) => {
      let cumulativeY = 0
      
      return widgets.map((widget, index) => {
        const isStats = widget.type === "stats"
        
        if (isMobileBreakpoint) {
          const widgetHeight = isStats ? 3 : 5
          const layout = {
            i: widget.id,
            x: 0,
            y: cumulativeY,
            w: cols,
            h: widgetHeight,
            minW: cols,
            minH: isStats ? 3 : 4,
            maxH: isStats ? 3 : 8,
            isResizable: false,
            static: true, // Make widgets static on mobile
          }
          
          cumulativeY += widgetHeight + 1
          return layout
        } else {
          const defaultW = isStats ? 12 : 6
          const defaultH = isStats ? 4 : 6

          return {
            i: widget.id,
            x: widget.x ?? (index % 2) * 6,
            y: widget.y ?? Math.floor(index / 2) * 6,
            w: widget.w ?? defaultW,
            h: widget.h ?? defaultH,
            minW: isStats ? 12 : 6,
            minH: isStats ? 3 : 4,
            maxH: isStats ? 4 : 8,
            isResizable: true,
          }
        }
      })
    }

    return {
      lg: createLayout(12, false),
      md: createLayout(10, false),
      sm: createLayout(6, true),
      xs: createLayout(4, true),
      xxs: createLayout(2, true),
    }
  }, [widgets])

  if (widgets.length === 0) {
    console.log('🔍 SimpleDashboardGrid: No widgets to display')
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
    console.log('🔍 SimpleDashboardGrid: Layout changed:', layout?.length)
    onLayoutChange(layout)
  }

  console.log('🔍 SimpleDashboardGrid: About to render grid with', widgets.length, 'widgets')

  return (
    <div className="w-full h-full">
      <ResponsiveGridLayout
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={isMobile ? 45 : 50}
        isDraggable={!isMobile}
        isResizable={!isMobile}
        onDragStop={handleLayoutChange}
        className={cn(
          "w-full", 
          isMobile ? "min-h-[300px] gap-y-2" : "min-h-[500px]"
        )}
        margin={isMobile ? [12, 12] : [16, 16]}
        containerPadding={isMobile ? [8, 8] : [16, 16]}
        compactType="vertical"
        preventCollision={false}
        autoSize={true}
      >
        {widgets.map((widget) => {
          console.log('🔍 SimpleDashboardGrid: Processing widget:', widget.id, widget.type)
          
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

          console.log('🔍 SimpleDashboardGrid: Widget', widget.id, 'will use', widgetExpenses?.length, 'expenses')

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