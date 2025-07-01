
"use client"

import * as React from "react"
import { ArrowDown, ArrowUp, Banknote, List } from "lucide-react"

import type { Expense } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatsWidgetProps {
  expenses: Expense[]
}

export function StatsWidget({ expenses }: StatsWidgetProps) {
  const stats = React.useMemo(() => {
    const totalExpenses = expenses
      .filter((e) => e.amount > 0)
      .reduce((sum, e) => sum + e.amount, 0)
    const totalRefunds = expenses
      .filter((e) => e.amount < 0)
      .reduce((sum, e) => sum + e.amount, 0)
    const transactionCount = expenses.length

    return {
      totalExpenses,
      totalRefunds: Math.abs(totalRefunds),
      netTotal: totalExpenses + totalRefunds,
      transactionCount,
    }
  }, [expenses])

  return (
    <div className="h-full w-full p-5">
      <div className="grid h-full grid-cols-2 grid-rows-2 gap-4">
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">
              Total Expenses
            </CardTitle>
            <ArrowDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent className="flex flex-1 flex-col items-center justify-center">
            <div className="text-4xl font-bold">
              {formatCurrency(stats.totalExpenses)}
            </div>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">
              Total Refunds
            </CardTitle>
            <ArrowUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="flex flex-1 flex-col items-center justify-center">
            <div className="text-4xl font-bold">
              {formatCurrency(stats.totalRefunds)}
            </div>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Net Total</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-1 flex-col items-center justify-center">
            <div className="text-4xl font-bold">
              {formatCurrency(stats.netTotal)}
            </div>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Transactions</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-1 flex-col items-center justify-center">
            <div className="text-4xl font-bold">{stats.transactionCount}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
