
"use client"

import * as React from "react"
import { X } from "lucide-react"

import { useSettings } from "@/contexts/settings-context"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

interface ExpensesFiltersProps {
  filters: {
    month: string
    category: string
    accountType: string
  }
  onFilterChange: (
    filterType: "month" | "category" | "accountType",
    value: string
  ) => void
  onClearFilters: () => void
  months: { value: string; label: string }[]
}

export function ExpensesFilters({
  filters,
  onFilterChange,
  onClearFilters,
  months,
}: ExpensesFiltersProps) {
  const { categories, accountTypes } = useSettings()

  const handleClearFilters = () => {
    onClearFilters()
  }

  const showClearButton =
    filters.month !== "all" ||
    filters.category !== "all" ||
    filters.accountType !== "all"

  if (!categories || !accountTypes) {
    return <Skeleton className="h-40 w-full" />
  }

  return (
    <div className="flex flex-col gap-4">
      <Select
        value={filters.month}
        onValueChange={(value) => onFilterChange("month", value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Filter by month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Months</SelectItem>
          {months.map((month) => (
            <SelectItem key={month.value} value={month.value}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.category}
        onValueChange={(value) => onFilterChange("category", value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Filter by category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.value} value={category.value}>
              {category.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.accountType}
        onValueChange={(value) => onFilterChange("accountType", value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Filter by account" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Accounts</SelectItem>
          {accountTypes.map((account) => (
            <SelectItem key={account.value} value={account.value}>
              {account.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showClearButton && (
        <Button
          variant="ghost"
          onClick={handleClearFilters}
          className="w-full justify-center"
        >
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  )
}
