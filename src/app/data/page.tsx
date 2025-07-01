
"use client"

import * as React from "react"
import { format, startOfMonth } from "date-fns"

import { useLocalStorage } from "@/hooks/use-local-storage"
import type { Expense } from "@/lib/types"
import { useSettings } from "@/contexts/settings-context"

import { AppLayout } from "@/components/app-layout"
import { ImportDataCard } from "@/components/data/import-data-card"
import { ExportExpensesButton } from "@/components/expenses/export-expenses-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function DataPage() {
  const [expenses] = useLocalStorage<Expense[]>("expenses", [])
  const { accounts, categories } = useSettings()
  const [selectedMonth, setSelectedMonth] = React.useState("all")

  const availableMonths = React.useMemo(() => {
    if (!expenses) return []
    const monthsMap = expenses.reduce((acc, expense) => {
      const monthValue = format(startOfMonth(new Date(expense.date)), "yyyy-MM")
      if (!acc.has(monthValue)) {
        const monthLabel = format(
          startOfMonth(new Date(expense.date)),
          "MMMM yyyy"
        )
        acc.set(monthValue, { value: monthValue, label: monthLabel })
      }
      return acc
    }, new Map<string, { value: string; label: string }>())

    return Array.from(monthsMap.values()).sort((a, b) =>
      b.value.localeCompare(a.value)
    )
  }, [expenses])

  const expensesToExport = React.useMemo(() => {
    if (!expenses || !categories || !accounts) return []

    const getCategoryLabel = (value: string) => {
      return categories.find((c) => c.value === value)?.label || value
    }

    const getAccountInfo = (id: string) => {
      const account = accounts.find((a) => a.value === id)
      return account
        ? { type: account.label, owner: account.owner }
        : { type: "Unknown", owner: "Unknown" }
    }

    const filteredExpenses =
      selectedMonth === "all"
        ? expenses
        : expenses.filter((expense) => {
            const expenseMonth = format(
              startOfMonth(new Date(expense.date)),
              "yyyy-MM"
            )
            return expenseMonth === selectedMonth
          })

    return filteredExpenses.map((expense) => {
      const accountInfo = getAccountInfo(expense.accountTypeId)
      return {
        date: format(new Date(expense.date), "yyyy-MM-dd"),
        category: getCategoryLabel(expense.category),
        amount: expense.amount,
        accountOwner: accountInfo.owner,
        accountType: accountInfo.type,
        description: expense.description,
      }
    })
  }, [expenses, selectedMonth, categories, accounts])

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Import & Export Data
        </h1>
        <div className="grid gap-6 lg:grid-cols-2">
          <ImportDataCard />
          <Card>
            <CardHeader>
              <CardTitle>Export Your Data</CardTitle>
              <CardDescription>
                Download a CSV file of your recorded expenses. You can export
                all data or select a specific month.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="month-select">Month to Export</Label>
                <Select
                  value={selectedMonth}
                  onValueChange={setSelectedMonth}
                >
                  <SelectTrigger id="month-select">
                    <SelectValue placeholder="Select a month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All time</SelectItem>
                    {availableMonths.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ExportExpensesButton data={expensesToExport} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
