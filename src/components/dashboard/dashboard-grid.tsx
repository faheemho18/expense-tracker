
"use client"

import * as React from "react"
import { format, getYear, startOfMonth } from "date-fns"
import { BarChart } from "lucide-react"

import type { Expense, WidgetConfig, WidgetFilters } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { AccountTypePieChartWidget } from "./account-type-pie-chart-widget"
import { CategoryPieChartWidget } from "./category-pie-chart-widget"
import { HeatmapCalendarWidget } from "./heatmap-calendar-widget"
import { OverTimeBarChartWidget } from "./over-time-bar-chart-widget"
import { StackedAreaChartWidget } from "./stacked-area-chart-widget"
import { StatsWidget } from "./stats-widget"
import { WidgetWrapper } from "./widget-wrapper"
import { Responsive, WidthProvider, type Layout } from "react-grid-layout"

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
      lg: widgets.map((widget, index) => ({
        i: widget.id,
        x: widget.x ?? (index % 2) * 6,
        y: widget.y ?? Infinity,
        w: widget.w ?? 6,
        h: widget.h ?? 8,
        minH: 2,
        minW: 3,
      })),
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

  return (
    <ResponsiveGridLayout
      layouts={layouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={50}
      draggableHandle=".drag-handle"
      onDragStop={handleLayoutChange}
      onResizeStop={handleLayoutChange}
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
