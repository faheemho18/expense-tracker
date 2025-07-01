
"use client"

import * as React from "react"
import { format, getYear, startOfMonth } from "date-fns"
import { BarChart } from "lucide-react"
import { Responsive, WidthProvider, type Layout } from "react-grid-layout"

import type { Expense, WidgetConfig, WidgetFilters } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { AccountTypePieChartWidget } from "./account-type-pie-chart-widget"
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
  removeWidget: (id: string) => void
  updateWidgetTitle: (id: string, title: string) => void
  updateWidgetFilters: (id: string, filters: WidgetFilters) => void
  availableMonths: { value: string; label: string }[]
  availableYears: { value: string; label: string }[]
  areGlobalFiltersActive: boolean
  onLayoutChange: (layout: Layout[]) => void
}

const renderWidget = (widget: WidgetConfig, expenses: Expense[]) => {
  switch (widget.type) {
    case "stats":
      return <StatsWidget expenses={expenses} />
    case "category-pie":
      return <CategoryPieChartWidget expenses={expenses} />
    case "over-time-bar":
      return <OverTimeBarChartWidget expenses={expenses} />
    case "account-type-pie":
      return <AccountTypePieChartWidget expenses={expenses} />
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
  removeWidget,
  updateWidgetTitle,
  updateWidgetFilters,
  availableMonths,
  availableYears,
  areGlobalFiltersActive,
  onLayoutChange,
}: DashboardGridProps) {
  const layouts = React.useMemo(() => {
    if (!widgets) return { lg: [] }
    return {
      lg: widgets.map((widget) => {
        const isChart = widget.type !== "stats"
        const defaultW = isChart ? 6 : 12
        const defaultH = isChart ? 6 : 4

        return {
          i: widget.id,
          x: widget.x ?? 0,
          y: widget.y ?? Infinity, // RGL will place it at the bottom
          w: widget.w ?? defaultW,
          h: widget.h ?? defaultH,
          minW: isChart ? 6 : 12,
          minH: isChart ? 6 : 4,
          maxH: isChart ? 6 : 4,
          isResizable: isChart,
        }
      }),
    }
  }, [widgets])

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

    let snappedWidth = newItem.w
    // For charts, snap width to 6 or 12. Anything <= 9 snaps to 6.
    if (widget.type !== "stats") {
      snappedWidth = newItem.w <= 9 ? 6 : 12
    } else {
      snappedWidth = 12
    }

    const newLayout = layout.map((l) => {
      if (l.i === newItem.i) {
        return { ...l, w: snappedWidth }
      }
      return l
    })

    onLayoutChange(newLayout)
  }

  return (
    <ResponsiveGridLayout
      layouts={layouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={50}
      draggableHandle=".drag-handle"
      onDragStop={handleLayoutChange}
      onResizeStop={handleResizeStop}
      className="min-h-[500px]"
    >
      {widgets.map((widget) => {
        const widgetFilters = widget.filters
        const hasWidgetFilters =
          widgetFilters &&
          ((widgetFilters.year?.length ?? 0) > 0 ||
            (widgetFilters.month?.length ?? 0) > 0 ||
            (widgetFilters.category?.length ?? 0) > 0 ||
            (widgetFilters.accountType?.length ?? 0) > 0)

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
            accountType = [],
          } = widgetFilters!

          widgetExpenses = expenses.filter((expense) => {
            const expenseDate = new Date(expense.date)
            const expenseYear = getYear(expenseDate).toString()
            const expenseMonth = format(startOfMonth(expenseDate), "yyyy-MM")

            const yearMatch = year.length === 0 || year.includes(expenseYear)
            const monthMatch = month.length === 0 || month.includes(expenseMonth)
            const categoryMatch =
              category.length === 0 || category.includes(expense.category)
            const accountTypeMatch =
              accountType.length === 0 ||
              accountType.includes(expense.accountType)

            return yearMatch && monthMatch && categoryMatch && accountTypeMatch
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
              {renderWidget(widget, widgetExpenses)}
            </WidgetWrapper>
          </div>
        )
      })}
    </ResponsiveGridLayout>
  )
}
