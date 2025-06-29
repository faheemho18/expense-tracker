
"use client"

import * as React from "react"
import { PiggyBank } from "lucide-react"

import { useSettings } from "@/contexts/settings-context"
import type { Expense } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

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
    return (
      <div className="flex justify-center">
        <Skeleton className="h-32 w-32 rounded-full" />
      </div>
    )
  }

  return (
    <div className="relative mb-4 flex h-32 items-center justify-center">
      <PiggyBank className="absolute h-32 w-32 text-muted-foreground/20" />
      <div className="relative flex flex-col items-center">
        <div className="text-3xl font-bold text-emerald-500">
          + {formatCurrency(projectedSavings)}
        </div>
        <p className="text-xs text-muted-foreground">
          Projected Monthly Savings
        </p>
      </div>
    </div>
  )
}
