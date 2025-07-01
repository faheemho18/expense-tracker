"use client"

import * as React from "react"
import { getYear, getMonth } from "date-fns"

import type { Expense } from "@/lib/types"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn, formatCurrency } from "@/lib/utils"

interface HeatmapCalendarWidgetProps {
  expenses: Expense[]
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

export function HeatmapCalendarWidget({
  expenses,
}: HeatmapCalendarWidgetProps) {
  const data = React.useMemo(() => {
    const year = getYear(new Date()) // Assume current year for simplicity
    const monthlyTotals = Array(12).fill(0)

    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.date)
      if (getYear(expenseDate) === year && expense.amount > 0) {
        const month = getMonth(expenseDate)
        monthlyTotals[month] += expense.amount
      }
    })

    const maxSpending = Math.max(...monthlyTotals)

    return monthlyTotals.map((total, index) => ({
      month: MONTHS[index],
      total,
      intensity: maxSpending > 0 ? Math.ceil((total / maxSpending) * 4) : 0, // 0-4 scale
    }))
  }, [expenses])

  const hasData = expenses.some(
    (e) => getYear(new Date(e.date)) === getYear(new Date())
  )

  if (!hasData) {
    return (
      <div className="flex h-full items-center justify-center p-3 text-muted-foreground">
        No expense data for the current year.
      </div>
    )
  }

  const intensityClasses = [
    "bg-muted/50",
    "bg-destructive/20",
    "bg-destructive/40",
    "bg-destructive/60",
    "bg-destructive/80",
  ]

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col gap-2 p-3">
        <div className="grid flex-1 grid-cols-4 grid-rows-3 gap-2">
          {data.map((monthData) => (
            <Tooltip key={monthData.month}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex items-center justify-center rounded-md p-1 text-xs font-medium text-foreground transition-colors sm:text-sm",
                    intensityClasses[monthData.intensity]
                  )}
                >
                  {monthData.month}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{formatCurrency(monthData.total)}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  )
}
