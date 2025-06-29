
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Filter, Plus } from "lucide-react"
import {
  addMonths,
  format,
  isAfter,
  startOfMonth,
  subMonths,
} from "date-fns"

import { useLocalStorage } from "@/hooks/use-local-storage"
import type { Expense } from "@/lib/types"

import { AppLayout } from "@/components/app-layout"
import { CategoryGaugesWidget } from "@/components/dashboard/category-gauges-widget"
import { ProjectedSavingsWidget } from "@/components/dashboard/projected-savings-widget"
import { AddExpenseSheet } from "@/components/expenses/add-expense-sheet"
import { ExpensesFilters } from "@/components/expenses/expenses-filters"
import { ExpensesTable } from "@/components/expenses/expenses-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export default function HomePage() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>("expenses", [])
  const [isAddSheetOpen, setIsAddSheetOpen] = React.useState(false)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = React.useState(false)
  const [expenseToEdit, setExpenseToEdit] = React.useState<Expense | null>(null)
  const [filters, setFilters] = React.useState<{
    year: string[]
    month: string[]
    category: string[]
    accountType: string[]
  }>({
    year: [],
    month: [format(new Date(), "yyyy-MM")],
    category: [],
    accountType: [],
  })
  const [gaugesMonth, setGaugesMonth] = React.useState(new Date())

  const handlePreviousMonth = () => {
    setGaugesMonth((prev) => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setGaugesMonth((prev) => addMonths(prev, 1))
  }

  const addExpense = (expense: Omit<Expense, "id">) => {
    const newExpense = { ...expense, id: crypto.randomUUID() }
    setExpenses((prevExpenses) => [...(prevExpenses || []), newExpense])
  }

  const updateExpense = (updatedExpense: Expense) => {
    setExpenses((prevExpenses) =>
      (prevExpenses || []).map((expense) =>
        expense.id === updatedExpense.id ? updatedExpense : expense
      )
    )
  }

  const deleteExpense = (id: string) => {
    setExpenses((prevExpenses) =>
      (prevExpenses || []).filter((expense) => expense.id !== id)
    )
  }

  const handleEdit = (expense: Expense) => {
    setExpenseToEdit(expense)
    setIsAddSheetOpen(true)
  }

  const handleSheetOpenChange = (open: boolean) => {
    setIsAddSheetOpen(open)
    if (!open) {
      setExpenseToEdit(null)
    }
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
    setFilters({ year: [], month: [], category: [], accountType: [] })
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

  const availableYears = React.useMemo(() => {
    if (!expenses) return []
    const yearsMap = expenses.reduce((acc, expense) => {
      const yearValue = new Date(expense.date).getFullYear().toString()
      if (!acc.has(yearValue)) {
        acc.set(yearValue, { value: yearValue, label: yearValue })
      }
      return acc
    }, new Map<string, { value: string; label: string }>())

    return Array.from(yearsMap.values()).sort((a, b) =>
      b.value.localeCompare(a.value)
    )
  }, [expenses])

  const filteredExpenses = React.useMemo(() => {
    if (!expenses) return []
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date)
      const expenseYear = expenseDate.getFullYear().toString()
      const expenseMonth = format(startOfMonth(expenseDate), "yyyy-MM")

      const yearMatch =
        filters.year.length === 0 || filters.year.includes(expenseYear)
      const monthMatch =
        filters.month.length === 0 || filters.month.includes(expenseMonth)
      const categoryMatch =
        filters.category.length === 0 ||
        filters.category.includes(expense.category)
      const accountTypeMatch =
        filters.accountType.length === 0 ||
        filters.accountType.includes(expense.accountType)

      return yearMatch && monthMatch && categoryMatch && accountTypeMatch
    })
  }, [expenses, filters])

  const gaugesMonthExpenses = React.useMemo(() => {
    if (!expenses) return []
    const selectedMonth = format(startOfMonth(gaugesMonth), "yyyy-MM")
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date)
      const expenseMonth = format(startOfMonth(expenseDate), "yyyy-MM")
      return expenseMonth === selectedMonth
    })
  }, [expenses, gaugesMonth])

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <div className="space-y-6">
          <Card>
            <CardHeader className="grid grid-cols-3 items-end">
              <CardTitle>Monthly Report</CardTitle>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePreviousMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous month</span>
                </Button>
                <span className="w-32 text-center font-medium">
                  {format(gaugesMonth, "MMMM yyyy")}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextMonth}
                  disabled={isAfter(
                    startOfMonth(gaugesMonth),
                    startOfMonth(new Date())
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next month</span>
                </Button>
              </div>
              <div className="flex justify-center">
                <ProjectedSavingsWidget expenses={gaugesMonthExpenses} />
              </div>
            </CardHeader>
            <CardContent>
              <div>
                <h3 className="mb-4 text-lg font-semibold tracking-tight">
                  Monthly Threshold Progress
                </h3>
                <CategoryGaugesWidget expenses={gaugesMonthExpenses} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transactions</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterSheetOpen(true)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </CardHeader>
            <CardContent>
              <ExpensesTable
                expenses={filteredExpenses}
                deleteExpense={deleteExpense}
                editExpense={handleEdit}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      <Button
        onClick={() => {
          setExpenseToEdit(null)
          setIsAddSheetOpen(true)
        }}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
        size="icon"
      >
        <span className="sr-only">Add Expense</span>
        <Plus className="h-6 w-6" />
      </Button>
      <AddExpenseSheet
        isOpen={isAddSheetOpen}
        setIsOpen={handleSheetOpenChange}
        addExpense={addExpense}
        updateExpense={updateExpense}
        expenseToEdit={expenseToEdit}
      />
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>
              Refine your view of transactions.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <h4 className="text-sm font-medium">Filter by</h4>
            <ExpensesFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
              months={availableMonths}
              years={availableYears}
            />
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  )
}
