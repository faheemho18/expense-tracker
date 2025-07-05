
"use client"

import * as React from "react"
import { PiggyBank } from "lucide-react"

import { useSettings } from "@/contexts/settings-context"
import type { Expense } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

import { Skeleton } from "@/components/ui/skeleton"
import { CurrencyTicker } from "@/components/ui/currency-ticker"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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

  // Remove skeleton loading - component should render with default data

  const formattedSavings = `+${formatCurrency(projectedSavings, "compact")}`
  const fullSavings = `Projected Savings: ${formatCurrency(projectedSavings)}`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative flex h-32 w-32 items-center justify-center">
          <PiggyBank className="absolute h-32 w-32 text-muted-foreground/20" />
          <div className="relative text-3xl font-bold text-emerald-500">
            <CurrencyTicker 
              value={projectedSavings} 
              notation="compact"
              delay={0.3}
              className="text-emerald-500"
            />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{fullSavings}</p>
      </TooltipContent>
    </Tooltip>
  )
}
