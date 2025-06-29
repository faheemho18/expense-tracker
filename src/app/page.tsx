"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { format, startOfMonth } from "date-fns"

import { useLocalStorage } from "@/hooks/use-local-storage"
import type { Expense } from "@/lib/types"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AppLayout } from "@/components/app-layout"
import { AddExpenseSheet } from "@/components/expenses/add-expense-sheet"
import { ExpensesFilters } from "@/components/expenses/expenses-filters"
import { ExpensesTable } from "@/components/expenses/expenses-table"
import { ExportExpensesButton } from "@/components/expenses/export-expenses-button"

export default function HomePage() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>("expenses", [])
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [filters, setFilters] = React.useState<{
    month: string
    category: string
    accountType: string
  }>({
    month: "all",
    category: "all",
    accountType: "all",
  })

  const addExpense = (expense: Omit<Expense, "id">) => {
    const newExpense = { ...expense, id: crypto.randomUUID() }
    setExpenses((prevExpenses) => [...(prevExpenses || []), newExpense])
  }

  const deleteExpense = (id: string) => {
    setExpenses((prevExpenses) =>
      (prevExpenses || []).filter((expense) => expense.id !== id)
    )
  }

  const handleFilterChange = (
    filterType: keyof typeof filters,
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }))
  }

  const clearFilters = () => {
    setFilters({ month: "all", category: "all", accountType: "all" })
  }

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

  const filteredExpenses = React.useMemo(() => {
    if (!expenses) return []
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date)
      const expenseMonth = format(startOfMonth(expenseDate), "yyyy-MM")

      const monthMatch =
        filters.month === "all" || expenseMonth === filters.month
      const categoryMatch =
        filters.category === "all" || expense.category === filters.category
      const accountTypeMatch =
        filters.accountType === "all" ||
        expense.accountType === filters.accountType

      return monthMatch && categoryMatch && accountTypeMatch
    })
  }, [expenses, filters])

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Your Expenses</CardTitle>
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                <ExpensesFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={clearFilters}
                  months={availableMonths}
                />
                <ExportExpensesButton expenses={filteredExpenses} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ExpensesTable
              expenses={filteredExpenses}
              deleteExpense={deleteExpense}
            />
          </CardContent>
        </Card>
      </div>
      <Button
        onClick={() => setIsSheetOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
        size="icon"
      >
        <span className="sr-only">Add Expense</span>
        <Plus className="h-6 w-6" />
      </Button>
      <AddExpenseSheet
        isOpen={isSheetOpen}
        setIsOpen={setIsSheetOpen}
        addExpense={addExpense}
      />
    </AppLayout>
  )
}
