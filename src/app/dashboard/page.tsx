
"use client"

import * as React from "react"
import { Filter, Plus } from "lucide-react"
import type { DropResult } from "@hello-pangea/dnd"
import { format, startOfMonth } from "date-fns"

import { useLocalStorage } from "@/hooks/use-local-storage"
import type { Expense, WidgetConfig, WidgetFilters } from "@/lib/types"

import { Button } from "@/components/ui/button"
import { AppLayout } from "@/components/app-layout"
import { AddWidgetDialog } from "@/components/dashboard/add-widget-dialog"
import { DashboardGrid } from "@/components/dashboard/dashboard-grid"
import { ExpensesFilters } from "@/components/expenses/expenses-filters"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "1", type: "stats", title: "Overview" },
  { id: "2", type: "category-pie", title: "Spending by Category" },
  { id: "3", type: "over-time-bar", title: "Monthly Spending" },
]

export default function DashboardPage() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>("expenses", [])
  const [widgets, setWidgets] = useLocalStorage<WidgetConfig[]>(
    "widgets",
    DEFAULT_WIDGETS
  )
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = React.useState(false)
  const [filters, setFilters] = React.useState<WidgetFilters>({
    month: [],
    category: [],
    accountType: [],
  })

  const addWidget = (widget: Omit<WidgetConfig, "id">) => {
    const newWidget = { ...widget, id: crypto.randomUUID() }
    setWidgets((prev) => [...(prev || []), newWidget])
  }

  const removeWidget = (id: string) => {
    setWidgets((prevWidgets) =>
      (prevWidgets || []).filter((widget) => widget.id !== id)
    )
  }

  const updateWidgetTitle = (id: string, title: string) => {
    setWidgets((prevWidgets) =>
      (prevWidgets || []).map((widget) =>
        widget.id === id ? { ...widget, title } : widget
      )
    )
  }

  const updateWidgetFilters = (id: string, filters: WidgetFilters) => {
    setWidgets((prevWidgets) =>
      (prevWidgets || []).map((widget) =>
        widget.id === id ? { ...widget, filters } : widget
      )
    )
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !widgets) {
      return
    }

    const items = Array.from(widgets)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setWidgets(items)
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

  const handleFilterChange = (
    filterType: keyof WidgetFilters,
    value: string
  ) => {
    setFilters((prev) => {
      const currentValues = prev[filterType] || []
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value]
      return { ...prev, [filterType]: newValues }
    })
  }

  const clearFilters = () => {
    setFilters({ month: [], category: [], accountType: [] })
  }

  const areGlobalFiltersActive = React.useMemo(() => {
    return (
      (filters.month?.length ?? 0) > 0 ||
      (filters.category?.length ?? 0) > 0 ||
      (filters.accountType?.length ?? 0) > 0
    )
  }, [filters])

  const filteredExpenses = React.useMemo(() => {
    if (!expenses) return []
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date)
      const expenseMonth = format(startOfMonth(expenseDate), "yyyy-MM")

      const monthMatch =
        !filters.month ||
        filters.month.length === 0 ||
        filters.month.includes(expenseMonth)
      const categoryMatch =
        !filters.category ||
        filters.category.length === 0 ||
        filters.category.includes(expense.category)
      const accountTypeMatch =
        !filters.accountType ||
        filters.accountType.length === 0 ||
        filters.accountType.includes(expense.accountType)

      return monthMatch && categoryMatch && accountTypeMatch
    })
  }, [expenses, filters])

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterSheetOpen(true)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>

        <DashboardGrid
          expenses={filteredExpenses || []}
          widgets={widgets || []}
          removeWidget={removeWidget}
          updateWidgetTitle={updateWidgetTitle}
          onDragEnd={onDragEnd}
          updateWidgetFilters={updateWidgetFilters}
          availableMonths={availableMonths}
          areGlobalFiltersActive={areGlobalFiltersActive}
        />
      </div>
      <Button
        onClick={() => setIsDialogOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full shadow-lg"
        size="icon"
      >
        <span className="sr-only">Add Widget</span>
        <Plus className="h-6 w-6" />
      </Button>
      <AddWidgetDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        addWidget={addWidget}
      />
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Global Dashboard Filters</SheetTitle>
            <SheetDescription>
              Apply filters to all widgets on the dashboard.
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
        </SheetContent>
      </Sheet>
    </AppLayout>
  )
}
