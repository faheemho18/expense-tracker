
"use client"

import * as React from "react"
import { PiggyBank } from "lucide-react"

import { useSettings } from "@/contexts/settings-context"
import type { Expense } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface ProjectedSavingsWidgetProps {
  expenses: Expense[]
}

export function ProjectedSavingsWidget({
  expenses,
}: ProjectedSavingsWidgetProps) {
  const { categories } = useSettings()

  const projectedSavings = React.useMemo(() => {
    if (!categories) return 0

    const categoryTotals = expenses.reduce(
      (acc, expense) => {
        if (expense.amount > 0) {
          acc[expense.category] =
            (acc[expense.category] || 0) + expense.amount
        }
        return acc
      },
      {} as Record<string, number>
    )

    const totalUnusedThreshold = categories.reduce((total, category) => {
      if (category.threshold && category.threshold > 0) {
        const spent = categoryTotals[category.value] || 0
        const unused = category.threshold - spent
        if (unused > 0) {
          total += unused
        }
      }
      return total
    }, 0)

    return totalUnusedThreshold
  }, [expenses, categories])

  if (!categories) {
    return <Skeleton className="h-[110px] w-full" />
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Projected Monthly Savings
        </CardTitle>
        <PiggyBank className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatCurrency(projectedSavings)}
        </div>
        <p className="text-xs text-muted-foreground">
          Based on remaining thresholds for this month.
        </p>
      </CardContent>
    </Card>
  )
}
