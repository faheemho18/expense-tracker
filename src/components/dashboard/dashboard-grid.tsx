
"use client"

import * as React from "react"
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd"
import { format, startOfMonth } from "date-fns"
import { BarChart } from "lucide-react"

import type { Expense, WidgetConfig, WidgetFilters } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { AccountTypePieChartWidget } from "./account-type-pie-chart-widget"
import { CategoryGaugesWidget } from "./category-gauges-widget"
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
  availableMonths: { value: string; label: string }[]
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
    case "category-gauges":
      return <CategoryGaugesWidget expenses={expenses} />
    default:
      return null
  }
}

const getWidgetWidthClass = (widgetType: WidgetConfig["type"]) => {
  switch (widgetType) {
    case "stats":
    case "stacked-area":
    case "category-gauges":
      return "w-full"
    case "heatmap-calendar":
      return "w-full md:w-1/2"
    case "category-pie":
    case "over-time-bar":
    case "account-type-pie":
    default:
      return "w-full md:w-1/2 lg:w-1/3"
  }
}

// Helper function to filter expenses based on widget's specific filters
const filterExpensesForWidget = (
  allExpenses: Expense[],
  widgetFilters?: WidgetFilters
): Expense[] => {
  if (!widgetFilters) {
    return allExpenses
  }

  const {
    month = [],
    category = [],
    accountType = [],
  } = widgetFilters

  if (month.length === 0 && category.length === 0 && accountType.length === 0) {
    return allExpenses
  }

  return allExpenses.filter((expense) => {
    const expenseDate = new Date(expense.date)
    const expenseMonth = format(startOfMonth(expenseDate), "yyyy-MM")

    const monthMatch = month.length === 0 || month.includes(expenseMonth)
    const categoryMatch =
      category.length === 0 || category.includes(expense.category)
    const accountTypeMatch =
      accountType.length === 0 || accountType.includes(expense.accountType)

    return monthMatch && categoryMatch && accountTypeMatch
  })
}

export function DashboardGrid({
  expenses,
  widgets,
  removeWidget,
  updateWidgetTitle,
  onDragEnd,
  updateWidgetFilters,
  availableMonths,
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
            className="-m-2 flex flex-wrap"
          >
            {widgets.map((widget, index) => {
              const widgetExpenses = filterExpensesForWidget(
                expenses,
                widget.filters
              )
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
                      className={cn("p-2", getWidgetWidthClass(widget.type))}
                      isDragging={snapshot.isDragging}
                      draggableProps={provided.draggableProps}
                      dragHandleProps={provided.dragHandleProps}
                      updateWidgetFilters={updateWidgetFilters}
                      availableMonths={availableMonths}
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
