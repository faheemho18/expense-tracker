"use client"

import type { Expense, WidgetConfig } from "@/lib/types"
import { WidgetWrapper } from "./widget-wrapper"
import { StatsWidget } from "./stats-widget"
import { CategoryPieChartWidget } from "./category-pie-chart-widget"
import { OverTimeBarChartWidget } from "./over-time-bar-chart-widget"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BarChart } from "lucide-react"

interface DashboardGridProps {
  expenses: Expense[]
  widgets: WidgetConfig[]
  removeWidget: (id: string) => void
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
}: DashboardGridProps) {
  if (widgets.length === 0) {
    return (
      <Alert>
        <BarChart className="h-4 w-4" />
        <AlertTitle>Your Dashboard is Empty</AlertTitle>
        <AlertDescription>
          Click "Add Widget" to start building your dashboard and gain insights into your spending.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {widgets.map((widget) => (
        <WidgetWrapper
          key={widget.id}
          widget={widget}
          removeWidget={removeWidget}
          className={widget.type === 'stats' ? 'md:col-span-2 lg:col-span-3' : ''}
        >
          {renderWidget(widget, expenses)}
        </WidgetWrapper>
      ))}
    </div>
  )
}
