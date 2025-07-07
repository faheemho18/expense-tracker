"use client"

import * as React from "react"
import { format, getYear, startOfMonth } from "date-fns"
import { BarChart } from "lucide-react"

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

interface StaticDashboardGridProps {
  expenses: Expense[]
  widgets: WidgetConfig[]
  accounts: Account[]
  removeWidget: (id: string) => void
  updateWidgetTitle: (id: string, title: string) => void
  updateWidgetFilters: (id: string, filters: WidgetFilters) => void
  availableMonths: { value: string; label: string }[]
  availableYears: { value: string; label: string }[]
  areGlobalFiltersActive: boolean
  onLayoutChange: (layout: any) => void
}

const renderWidget = (
  widget: WidgetConfig,
  expenses: Expense[],
  accounts: Account[]
) => {
  console.log('🔍 StaticDashboardGrid: Rendering widget:', widget.type, widget.id)
  
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
        console.warn('🔍 StaticDashboardGrid: Unknown widget type:', widget.type)
        return (
          <div className="p-4 text-center text-muted-foreground">
            Widget type "{widget.type}" not implemented
          </div>
        )
    }
  } catch (error) {
    console.error('🚨 StaticDashboardGrid: Error rendering widget:', widget.type, error)
    return (
      <div className="p-4 text-center text-red-500 border border-red-200 rounded">
        <p>Error rendering {widget.type} widget</p>
        <p className="text-xs mt-1">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    )
  }
}

export function StaticDashboardGrid({
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
}: StaticDashboardGridProps) {
  console.log('🔍 StaticDashboardGrid: Component mounting')
  console.log('🔍 StaticDashboardGrid: Props received:', {
    expensesCount: expenses?.length,
    widgetsCount: widgets?.length,
    accountsCount: accounts?.length
  })
  
  const isMobile = useIsMobile()

  if (widgets.length === 0) {
    console.log('🔍 StaticDashboardGrid: No widgets to display')
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

  console.log('🔍 StaticDashboardGrid: About to render', widgets.length, 'widgets')

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-12 gap-4">
        {widgets.map((widget) => {
          console.log('🔍 StaticDashboardGrid: Processing widget:', widget.id, widget.type)
          
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

          console.log('🔍 StaticDashboardGrid: Widget', widget.id, 'will use', widgetExpenses?.length, 'expenses')

          // Determine grid classes based on widget type and mobile state
          const getGridClasses = () => {
            if (isMobile) {
              return "col-span-12" // Full width on mobile
            }
            
            switch (widget.type) {
              case "stats":
                return "col-span-12" // Stats always full width
              default:
                return "col-span-12 md:col-span-6" // Half width on desktop
            }
          }

          const getHeight = () => {
            switch (widget.type) {
              case "stats":
                return "h-[200px]"
              default:
                return "h-[300px]"
            }
          }

          return (
            <div 
              key={widget.id} 
              className={cn(
                getGridClasses(),
                getHeight(),
                "border rounded-lg"
              )}
            >
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
      </div>
    </div>
  )
}