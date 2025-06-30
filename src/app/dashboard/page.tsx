
"use client"

import * as React from "react"
import { Filter, Plus } from "lucide-react"
import { format, getYear, startOfMonth } from "date-fns"
import type { Layout } from "react-grid-layout"

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
import { Skeleton } from "@/components/ui/skeleton"

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "1", type: "stats", title: "Overview", x: 0, y: 0, w: 12, h: 5 },
  {
    id: "2",
    type: "category-pie",
    title: "Spending by Category",
    x: 0,
    y: 5,
    w: 4,
    h: 11,
  },
  {
    id: "3",
    type: "over-time-bar",
    title: "Monthly Spending",
    x: 4,
    y: 5,
    w: 8,
    h: 11,
  },
]

export default function DashboardPage() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>("expenses", [])
  const [widgets, setWidgets] = useLocalStorage<WidgetConfig[]>(
    "widgets",
    DEFAULT_WIDGETS
  )
  const [isMounted, setIsMounted] = React.useState(false)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = React.useState(false)
  const [filters, setFilters] = React.useState<WidgetFilters>({
    year: [],
    month: [],
    category: [],
    accountType: [],
  })

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const addWidget = (widget: Pick<WidgetConfig, "title" | "type">) => {
    setWidgets((prev = []) => {
      const y = Math.max(0, ...prev.map((w) => w.y + w.h))
      const newWidget: WidgetConfig = {
        ...widget,
        id: crypto.randomUUID(),
        x: 0,
        y: y,
        w: 6,
        h: 11,
      }
      return [...prev, newWidget]
    })
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

  const onLayoutChange = (layout: Layout[]) => {
    const changed = widgets?.some((w) => {
      const item = layout.find((l) => l.i === w.id)
      return (
        item && (item.x !== w.x || item.y !== w.y || item.w !== w.w || item.h !== w.h)
      )
    })

    if (changed) {
      setWidgets((prevWidgets) => {
        if (!prevWidgets) return []
        return prevWidgets.map((widget) => {
          const layoutItem = layout.find((l) => l.i === widget.id)
          if (layoutItem) {
            return {
              ...widget,
              x: layoutItem.x,
              y: layoutItem.y,
              w: layoutItem.w,
              h: layoutItem.h,
            }
          }
          return widget
        })
      })
    }
  }

  const updateWidgetFilters = (id: string, filters: WidgetFilters) => {
    setWidgets((prevWidgets) =>
      (prevWidgets || []).map((widget) =>
        widget.id === id ? { ...widget, filters } : widget
      )
    )
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
      const yearValue = getYear(new Date(expense.date)).toString()
      if (!acc.has(yearValue)) {
        acc.set(yearValue, { value: yearValue, label: yearValue })
      }
      return acc
    }, new Map<string, { value: string; label: string }>())

    return Array.from(yearsMap.values()).sort((a, b) =>
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
    setFilters({ year: [], month: [], category: [], accountType: [] })
  }

  const areGlobalFiltersActive = React.useMemo(() => {
    return (
      (filters.year?.length ?? 0) > 0 ||
      (filters.month?.length ?? 0) > 0 ||
      (filters.category?.length ?? 0) > 0 ||
      (filters.accountType?.length ?? 0) > 0
    )
  }, [filters])

  const filteredExpenses = React.useMemo(() => {
    if (!expenses) return []
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date)
      const expenseYear = getYear(expenseDate).toString()
      const expenseMonth = format(startOfMonth(expenseDate), "yyyy-MM")

      const yearMatch =
        !filters.year ||
        filters.year.length === 0 ||
        filters.year.includes(expenseYear)
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

      return yearMatch && monthMatch && categoryMatch && accountTypeMatch
    })
  }, [expenses, filters])

  const loadingSkeleton = (
    <div className="grid grid-cols-12 gap-4">
      <Skeleton className="col-span-12 h-[190px]" />
      <Skeleton className="col-span-4 h-[370px]" />
      <Skeleton className="col-span-8 h-[370px]" />
    </div>
  )

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

        {isMounted && widgets ? (
          <DashboardGrid
            expenses={filteredExpenses || []}
            widgets={widgets}
            removeWidget={removeWidget}
            updateWidgetTitle={updateWidgetTitle}
            onLayoutChange={onLayoutChange}
            updateWidgetFilters={updateWidgetFilters}
            availableMonths={availableMonths}
            availableYears={availableYears}
            areGlobalFiltersActive={areGlobalFiltersActive}
          />
        ) : (
          loadingSkeleton
        )}
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
              years={availableYears}
            />
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  )
}
