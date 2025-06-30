
"use client"

import * as React from "react"
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd"
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

interface DashboardGridProps {
  expenses: Expense[]
  widgets: WidgetConfig[]
  removeWidget: (id: string) => void
  updateWidgetTitle: (id: string, title: string) => void
  onDragEnd: (result: DropResult) => void
  updateWidgetFilters: (id: string, filters: WidgetFilters) => void
  updateWidgetSize: (id: string, width: string, height: string) => void
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

export function DashboardGrid({
  expenses,
  widgets,
  removeWidget,
  updateWidgetTitle,
  onDragEnd,
  updateWidgetFilters,
  updateWidgetSize,
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
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="dashboard">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="-m-2 flex flex-wrap items-start"
          >
            {widgets.map((widget, index) => {
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
                  const expenseMonth = format(
                    startOfMonth(expenseDate),
                    "yyyy-MM"
                  )

                  const yearMatch =
                    year.length === 0 || year.includes(expenseYear)
                  const monthMatch =
                    month.length === 0 || month.includes(expenseMonth)
                  const categoryMatch =
                    category.length === 0 ||
                    category.includes(expense.category)
                  const accountTypeMatch =
                    accountType.length === 0 ||
                    accountType.includes(expense.accountType)

                  return (
                    yearMatch && monthMatch && categoryMatch && accountTypeMatch
                  )
                })
              }

              return (
                <Draggable
                  key={widget.id}
                  draggableId={widget.id}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <WidgetWrapper
                      ref={provided.innerRef}
                      widget={widget}
                      removeWidget={removeWidget}
                      updateWidgetTitle={updateWidgetTitle}
                      className="p-2"
                      isDragging={snapshot.isDragging}
                      draggableProps={provided.draggableProps}
                      dragHandleProps={provided.dragHandleProps}
                      updateWidgetFilters={updateWidgetFilters}
                      updateWidgetSize={updateWidgetSize}
                      availableMonths={availableMonths}
                      availableYears={availableYears}
                    >
                      {renderWidget(widget, widgetExpenses)}
                    </WidgetWrapper>
                  )}
                </Draggable>
              )
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
