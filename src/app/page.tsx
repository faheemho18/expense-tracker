
"use client"

import * as React from "react"
import { Filter, Plus } from "lucide-react"
import { format, startOfMonth } from "date-fns"

import { useLocalStorage } from "@/hooks/use-local-storage"
import type { Expense } from "@/lib/types"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { AppLayout } from "@/components/app-layout"
import { AddExpenseSheet } from "@/components/expenses/add-expense-sheet"
import { ExpensesFilters } from "@/components/expenses/expenses-filters"
import { ExpensesTable } from "@/components/expenses/expenses-table"
import { ExportExpensesButton } from "@/components/expenses/export-expenses-button"

export default function HomePage() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>("expenses", [])
  const [isAddSheetOpen, setIsAddSheetOpen] = React.useState(false)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = React.useState(false)
  const [filters, setFilters] = React.useState<{
    month: string[]
    category: string[]
    accountType: string[]
  }>({
    month: [format(new Date(), "yyyy-MM")],
    category: [],
    accountType: [],
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
    setFilters((prev) => {
      const currentValues = prev[filterType]
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value]
      return { ...prev, [filterType]: newValues }
    })
  }

  const clearFilters = () => {
    setFilters({ month: [], category: [], accountType: [] })
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
        filters.month.length === 0 || filters.month.includes(expenseMonth)
      const categoryMatch =
        filters.category.length === 0 ||
        filters.category.includes(expense.category)
      const accountTypeMatch =
        filters.accountType.length === 0 ||
        filters.accountType.includes(expense.accountType)

      return monthMatch && categoryMatch && accountTypeMatch
    })
  }, [expenses, filters])

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Your Expenses</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterSheetOpen(true)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
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
        onClick={() => setIsAddSheetOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
        size="icon"
      >
        <span className="sr-only">Add Expense</span>
        <Plus className="h-6 w-6" />
      </Button>
      <AddExpenseSheet
        isOpen={isAddSheetOpen}
        setIsOpen={setIsAddSheetOpen}
        addExpense={addExpense}
      />
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Filters & Export</SheetTitle>
            <SheetDescription>
              Refine your view and export your expense data.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <h4 className="text-sm font-medium">Filter by</h4>
            <ExpensesFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
              months={availableMonths}
            />
          </div>
          <Separator />
          <div className="py-4">
            <ExportExpensesButton expenses={filteredExpenses} />
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  )
}
