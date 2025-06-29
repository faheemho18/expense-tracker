"use client"

import * as React from "react"
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "react-beautiful-dnd"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { BarChart } from "lucide-react"
import type { Expense, WidgetConfig } from "@/lib/types"

import { CategoryPieChartWidget } from "./category-pie-chart-widget"
import { OverTimeBarChartWidget } from "./over-time-bar-chart-widget"
import { StatsWidget } from "./stats-widget"
import { WidgetWrapper } from "./widget-wrapper"

interface DashboardGridProps {
  expenses: Expense[]
  widgets: WidgetConfig[]
  removeWidget: (id: string) => void
  onDragEnd: (result: DropResult) => void
}

const renderWidget = (widget: WidgetConfig, expenses: Expense[]) => {
  switch (widget.type) {
    case "stats":
      return <StatsWidget expenses={expenses} />
    case "category-pie":
      return <CategoryPieChartWidget expenses={expenses} />
    case "over-time-bar":
      return <OverTimeBarChartWidget expenses={expenses} />
    default:
      return null
  }
}

export function DashboardGrid({
  expenses,
  widgets,
  removeWidget,
  onDragEnd,
}: DashboardGridProps) {
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

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

  // react-beautiful-dnd doesn't work well with SSR, so we only render it on the client
  if (!isClient) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {widgets.map((widget) => (
          <Skeleton
            key={widget.id}
            className={cn(
              "h-[422px]",
              widget.type === "stats" ? "md:col-span-2 lg:col-span-3" : ""
            )}
          />
        ))}
      </div>
    )
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="dashboard">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {widgets.map((widget, index) => (
              <Draggable key={widget.id} draggableId={widget.id} index={index}>
                {(provided, snapshot) => (
                  <WidgetWrapper
                    ref={provided.innerRef}
                    widget={widget}
                    removeWidget={removeWidget}
                    className={
                      widget.type === "stats"
                        ? "md:col-span-2 lg:col-span-3"
                        : ""
                    }
                    isDragging={snapshot.isDragging}
                    draggableProps={provided.draggableProps}
                    dragHandleProps={provided.dragHandleProps}
                  >
                    {renderWidget(widget, expenses)}
                  </WidgetWrapper>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
