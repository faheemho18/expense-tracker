
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
import { cn } from "@/lib/utils"

interface DashboardGridProps {
  expenses: Expense[]
  widgets: WidgetConfig[]
  removeWidget: (id: string) => void
  updateWidgetTitle: (id: string, title: string) => void
  updateWidgetFilters: (id: string, filters: WidgetFilters) => void
  availableMonths: { value: string; label: string }[]
  availableYears: { value: string; label: string }[]
  areGlobalFiltersActive: boolean
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

const getWidgetWrapperClass = (widgetType: WidgetConfig["type"]) => {
  switch (widgetType) {
    case "stats":
      return "col-span-12"
    case "category-pie":
      return "col-span-12 md:col-span-6 lg:col-span-4 min-h-[400px]"
    case "over-time-bar":
      return "col-span-12 md:col-span-6 lg:col-span-8 min-h-[400px]"
    case "account-type-pie":
    case "stacked-area":
    case "heatmap-calendar":
      return "col-span-12 md:col-span-6 min-h-[400px]"
    default:
      return "col-span-12"
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
}: DashboardGridProps) {
  if (widgets.length === 0) {
    return (
      <Alert>
        <BarChart className="h-4 w-4" />
        <AlertTitle>Your Dashboard is Empty</AlertTitle>
        <AlertDescription>
          Click "Add Widget" to start building your dashboard and gain insights
          into your spending.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {widgets.map((widget) => {
        const widgetFilters = widget.filters
        const hasWidgetFilters =
          widgetFilters &&
          ((widgetFilters.year?.length ?? 0) > 0 ||
            (widgetFilters.month?.length ?? 0) > 0 ||
            (widgetFilters.category?.length ?? 0) > 0 ||
            (widgetFilters.accountType?.length ?? 0) > 0)

        let widgetExpenses = expenses

        // Default behavior for stats widget: current year if no filters active
        if (
          widget.type === "stats" &&
          !areGlobalFiltersActive &&
          !hasWidgetFilters
        ) {
          const currentYear = new Date().getFullYear()
          widgetExpenses = expenses.filter(
            (e) => new Date(e.date).getFullYear() === currentYear
          )
        }
        // Apply widget-specific filters
        else if (hasWidgetFilters) {
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

            const yearMatch =
              year.length === 0 || year.includes(expenseYear)
            const monthMatch =
              month.length === 0 || month.includes(expenseMonth)
            const categoryMatch =
              category.length === 0 || category.includes(expense.category)
            const accountTypeMatch =
              accountType.length === 0 ||
              accountType.includes(expense.accountType)

            return yearMatch && monthMatch && categoryMatch && accountTypeMatch
          })
        }

        return (
          <div key={widget.id} className={cn(getWidgetWrapperClass(widget.type))}>
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
    </div>
  )
}
