
"use client"

import * as React from "react"
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
} from "lucide-react"
import {
  addMonths,
  format,
  isAfter,
  startOfMonth,
  subMonths,
} from "date-fns"

import { useLocalStorage } from "@/hooks/use-local-storage"
import type { Expense } from "@/lib/types"
import { useSettings } from "@/contexts/settings-context"

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type SortableKey =
  | "date"
  | "description"
  | "category"
  | "accountType"
  | "amount"
type SortDirection = "ascending" | "descending"

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

  const [sortConfig, setSortConfig] = React.useState<{
    key: SortableKey
    direction: SortDirection
  } | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const { categories, accountTypes } = useSettings()
  const [gaugeSortOrder, setGaugeSortOrder] = React.useState<
    "ascending" | "descending" | null
  >(null)

  const ITEMS_PER_PAGE = 8

  const handlePreviousMonth = () => {
    setGaugesMonth((prev) => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setGaugesMonth((prev) => addMonths(prev, 1))
  }

  const handleGaugeSort = () => {
    setGaugeSortOrder((prev) => {
      if (prev === "ascending") {
        return "descending"
      }
      if (prev === "descending") {
        return null
      }
      return "ascending"
    })
  }

  const getGaugeSortIcon = () => {
    if (gaugeSortOrder === "ascending") {
      return <ArrowUp className="h-4 w-4" />
    }
    if (gaugeSortOrder === "descending") {
      return <ArrowDown className="h-4 w-4" />
    }
    return <ArrowUpDown className="h-4 w-4" />
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
    setCurrentPage(1)
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
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({ year: [], month: [], category: [], accountType: [] })
    setCurrentPage(1)
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

  const requestSort = (key: SortableKey) => {
    // If no sort is active, or sorting by a new column, sort ascending.
    if (!sortConfig || sortConfig.key !== key) {
      setSortConfig({ key, direction: "ascending" })
    }
    // If sorting ascending, switch to descending.
    else if (sortConfig.direction === "ascending") {
      setSortConfig({ key, direction: "descending" })
    }
    // If sorting descending, clear the sort (back to default).
    else {
      setSortConfig(null)
    }
    setCurrentPage(1)
  }

  const sortedExpenses = React.useMemo(() => {
    if (!filteredExpenses || !categories || !accountTypes) return []

    const getCategory = (value: string) => {
      return (categories || []).find((c) => c.value === value)
    }

    const getAccountType = (value: string) => {
      return (accountTypes || []).find((a) => a.value === value)
    }

    const sortableItems = [...filteredExpenses]
    const currentSort = sortConfig || { key: "date", direction: "descending" }

    if (currentSort) {
      sortableItems.sort((a, b) => {
        let comparison = 0
        switch (currentSort.key) {
          case "date":
            comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
            break
          case "amount":
            comparison = a.amount - b.amount
            break
          case "category":
            const categoryA = getCategory(a.category)?.label || ""
            const categoryB = getCategory(b.category)?.label || ""
            comparison = categoryA.localeCompare(categoryB)
            break
          case "accountType":
            const accountTypeA = getAccountType(a.accountType)?.label || ""
            const accountTypeB = getAccountType(b.accountType)?.label || ""
            comparison = accountTypeA.localeCompare(accountTypeB)
            break
          case "description":
            comparison = a.description.localeCompare(b.description)
            break
        }
        return currentSort.direction === "ascending" ? comparison : -comparison
      })
    }
    return sortableItems
  }, [filteredExpenses, sortConfig, categories, accountTypes])

  const paginatedExpenses = React.useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return sortedExpenses.slice(startIndex, endIndex)
  }, [sortedExpenses, currentPage])

  const totalPages = Math.ceil(sortedExpenses.length / ITEMS_PER_PAGE)

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <div className="space-y-6">
          <Card>
            <CardHeader className="relative grid grid-cols-3 items-center">
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
              <div />
              <div className="absolute right-6 top-1/2 z-10 -translate-y-1/2">
                <ProjectedSavingsWidget expenses={gaugesMonthExpenses} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center">
                <h3 className="text-lg font-semibold tracking-tight">
                  Monthly Threshold Progress
                </h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-5 h-8 w-8"
                        onClick={handleGaugeSort}
                      >
                        {getGaugeSortIcon()}
                        <span className="sr-only">Sort by percentage</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sort by Percentage</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CategoryGaugesWidget
                expenses={gaugesMonthExpenses}
                sortOrder={gaugeSortOrder}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transactions</CardTitle>
              <div className="flex items-center gap-4">
                {totalPages > 1 && (
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
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
                expenses={paginatedExpenses}
                deleteExpense={deleteExpense}
                editExpense={handleEdit}
                sortConfig={sortConfig}
                requestSort={requestSort}
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
