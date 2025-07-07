
"use client"

import * as React from "react"
import { Filter, Plus } from "lucide-react"
import { format, getYear, startOfMonth } from "date-fns"
import type { Layout } from "react-grid-layout"
import dynamic from "next/dynamic"

import { useLocalStorage } from "@/hooks/use-local-storage"
import { useSettings } from "@/contexts/settings-context"
import { useIsMobile, useHapticFeedback } from "@/hooks/use-mobile"
import { TOUCH_CLASSES } from "@/utils/mobile-utils"
import { cn } from "@/lib/utils"
import type {
  Account,
  Expense,
  WidgetConfig,
  WidgetFilters,
  WidgetType,
} from "@/lib/types"

import { Button } from "@/components/ui/button"
import { RainbowButton } from "@/components/magicui/rainbow-button"
import { AppLayout } from "@/components/app-layout"
import ErrorBoundary from "@/components/error-boundary"
import { AddWidgetSheet } from "@/components/dashboard/add-widget-sheet"
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
  { id: "1", type: "stats", title: "Overview", x: 0, y: 0, w: 12, h: 4 },
  {
    id: "2",
    type: "category-pie",
    title: "Spending by Category",
    x: 0,
    y: 4,
    w: 6,
    h: 6,
  },
  {
    id: "3",
    type: "over-time-bar",
    title: "Monthly Spending",
    x: 6,
    y: 4,
    w: 6,
    h: 6,
  },
]

const DashboardGridSkeleton = () => (
  <div className="grid grid-cols-12 gap-6">
    <div className="col-span-12">
      <Skeleton className="h-[200px] w-full" />
    </div>
    <div className="col-span-12 md:col-span-6">
      <Skeleton className="h-[300px] w-full" />
    </div>
    <div className="col-span-12 md:col-span-6">
      <Skeleton className="h-[300px] w-full" />
    </div>
  </div>
)

// Temporarily use simple dashboard grid for debugging
const DynamicDashboardGrid = dynamic(
  () =>
    import("@/components/dashboard/simple-dashboard-grid").then(
      (mod) => mod.SimpleDashboardGrid
    ),
  {
    ssr: false,
    loading: () => <DashboardGridSkeleton />,
  }
)

// Original complex grid with touch gestures (temporarily disabled)
// const DynamicDashboardGrid = dynamic(
//   () =>
//     import("@/components/dashboard/dashboard-grid").then(
//       (mod) => mod.DashboardGrid
//     ),
//   {
//     ssr: false,
//     loading: () => <DashboardGridSkeleton />,
//   }
// )

export default function DashboardPage() {
  console.log('🔍 DashboardPage: Component mounting')
  
  const [expenses] = useLocalStorage<Expense[]>("expenses", [])
  console.log('🔍 DashboardPage: Expenses loaded:', expenses?.length)
  
  const { accounts } = useSettings()
  console.log('🔍 DashboardPage: Accounts from settings:', accounts?.length)
  
  const [widgets, setWidgets] = useLocalStorage<WidgetConfig[]>(
    "widgets",
    DEFAULT_WIDGETS
  )
  console.log('🔍 DashboardPage: Widgets loaded:', widgets?.length)
  const [isWidgetSheetOpen, setIsWidgetSheetOpen] = React.useState(false)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = React.useState(false)
  const [filters, setFilters] = React.useState<WidgetFilters>({
    year: [],
    month: [],
    category: [],
    accountId: [],
  })
  const isMobile = useIsMobile()
  const { vibrate } = useHapticFeedback()

  const getNewWidgetLayout = (type: WidgetType) => {
    switch (type) {
      case "stats":
        return { w: 12, h: 4 }
      default: // All other widgets are charts
        return { w: 6, h: 6 }
    }
  }

  const addWidget = (widget: Pick<WidgetConfig, "title" | "type">) => {
    setWidgets((prev = []) => {
      const layout = getNewWidgetLayout(widget.type)
      const newWidget: WidgetConfig = {
        ...widget,
        id: crypto.randomUUID(),
        x: 0,
        y: Infinity, // react-grid-layout will place it at the bottom
        ...layout,
      }
      return [...(prev || []), newWidget]
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

  const updateWidgetFilters = (id: string, filters: WidgetFilters) => {
    setWidgets((prevWidgets) =>
      (prevWidgets || []).map((widget) =>
        widget.id === id ? { ...widget, filters } : widget
      )
    )
  }

  const handleLayoutChange = (newLayout: Layout[]) => {
    setWidgets((prevWidgets) => {
      if (!prevWidgets) return []
      return prevWidgets.map((widget) => {
        const layoutItem = newLayout.find((l) => l.i === widget.id)
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
    setFilters({ year: [], month: [], category: [], accountId: [] })
  }

  const areGlobalFiltersActive = React.useMemo(() => {
    return (
      (filters.year?.length ?? 0) > 0 ||
      (filters.month?.length ?? 0) > 0 ||
      (filters.category?.length ?? 0) > 0 ||
      (filters.accountId?.length ?? 0) > 0
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
      const accountMatch =
        !filters.accountId ||
        filters.accountId.length === 0 ||
        filters.accountId.includes(expense.accountTypeId)

      return yearMatch && monthMatch && categoryMatch && accountMatch
    })
  }, [expenses, filters])

  console.log('🔍 DashboardPage: About to render, filteredExpenses:', filteredExpenses?.length)

  return (
    <>
      <AppLayout>
        <ErrorBoundary onError={(error, errorInfo) => {
          console.error('🚨 Dashboard Error Boundary caught:', error, errorInfo)
        }}>
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

            <ErrorBoundary onError={(error, errorInfo) => {
              console.error('🚨 DashboardGrid Error Boundary caught:', error, errorInfo)
            }}>
              <DynamicDashboardGrid
                expenses={filteredExpenses || []}
                widgets={widgets || []}
                accounts={accounts || []}
                removeWidget={removeWidget}
                updateWidgetTitle={updateWidgetTitle}
                updateWidgetFilters={updateWidgetFilters}
                availableMonths={availableMonths}
                availableYears={availableYears}
                areGlobalFiltersActive={areGlobalFiltersActive}
                onLayoutChange={handleLayoutChange}
              />
            </ErrorBoundary>
          </div>
        </ErrorBoundary>
      
      <ErrorBoundary onError={(error, errorInfo) => {
        console.error('🚨 AddWidgetSheet Error Boundary caught:', error, errorInfo)
      }}>
        <AddWidgetSheet
          isOpen={isWidgetSheetOpen}
          setIsOpen={setIsWidgetSheetOpen}
          addWidget={addWidget}
        />
      </ErrorBoundary>
      
      <ErrorBoundary onError={(error, errorInfo) => {
        console.error('🚨 FilterSheet Error Boundary caught:', error, errorInfo)
      }}>
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
      </ErrorBoundary>
      </AppLayout>
      <RainbowButton
      onClick={() => {
        setIsWidgetSheetOpen(true)
        // Haptic feedback for mobile
        if (isMobile) {
          vibrate(100)
        }
      }}
      className={cn(
        "fixed z-[9999] rounded-full shadow-lg",
        TOUCH_CLASSES.TOUCH_FEEDBACK,
        isMobile 
          ? "bottom-20 right-4 h-16 w-16" // Above bottom nav on mobile
          : "bottom-6 right-6 h-14 w-14"
      )}
      size="icon"
    >
      <span className="sr-only">Add Chart</span>
      <Plus className={cn(
        isMobile ? "h-7 w-7" : "h-6 w-6"
      )} />
      </RainbowButton>
    </>
  )
}
