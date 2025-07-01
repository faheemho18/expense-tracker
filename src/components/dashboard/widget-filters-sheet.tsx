
"use client"

import * as React from "react"

import type { WidgetConfig, WidgetFilters } from "@/lib/types"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ExpensesFilters } from "@/components/expenses/expenses-filters"

interface WidgetFiltersSheetProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  widget: WidgetConfig
  updateWidgetFilters: (id: string, filters: WidgetFilters) => void
  months: { value: string; label: string }[]
  years: { value: string; label: string }[]
}

const defaultFilters: WidgetFilters = {
  year: [],
  month: [],
  category: [],
  accountId: [],
}

export function WidgetFiltersSheet({
  isOpen,
  setIsOpen,
  widget,
  updateWidgetFilters,
  months,
  years,
}: WidgetFiltersSheetProps) {
  const getInitialFilters = React.useCallback(
    () => ({
      ...defaultFilters,
      ...(widget.filters || {}),
    }),
    [widget.filters]
  )

  const [filters, setFilters] =
    React.useState<WidgetFilters>(getInitialFilters())

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
    setFilters(defaultFilters)
  }

  const handleApply = () => {
    updateWidgetFilters(widget.id, filters)
    setIsOpen(false)
  }

  React.useEffect(() => {
    if (isOpen) {
      setFilters(getInitialFilters())
    }
  }, [isOpen, getInitialFilters])

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filters for "{widget.title}"</SheetTitle>
          <SheetDescription>
            Refine the data shown in this widget.
          </SheetDescription>
        </SheetHeader>
        <div className="flex h-[calc(100%-8rem)] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto py-4">
            <ExpensesFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
              months={months}
              years={years}
            />
          </div>
          <div className="mt-auto border-t pt-4">
            <Button onClick={handleApply} className="w-full">
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
