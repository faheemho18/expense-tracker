
"use client"

import * as React from "react"
import { X } from "lucide-react"

import { useSettings } from "@/contexts/settings-context"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"

interface ExpensesFiltersProps {
  filters: {
    year: string[]
    month: string[]
    category: string[]
    accountId: string[]
  }
  onFilterChange: (
    filterType: "year" | "month" | "category" | "accountId",
    value: string
  ) => void
  onClearFilters: () => void
  months: { value: string; label: string }[]
  years: { value: string; label: string }[]
}

const FilterSection = ({
  title,
  items,
  selectedItems,
  onSelectionChange,
  renderLabel,
}: {
  title: string
  items: { value: string; label: string; [key: string]: any }[]
  selectedItems: string[]
  onSelectionChange: (value: string) => void
  renderLabel?: (item: any) => React.ReactNode
}) => (
  <AccordionItem value={title.toLowerCase().replace(/\s+/g, "-")}>
    <AccordionTrigger>{title}</AccordionTrigger>
    <AccordionContent>
      <ScrollArea className="h-48">
        <div className="space-y-2 pr-4">
          {items.map((item) => (
            <div key={item.value} className="flex items-center space-x-2">
              <Checkbox
                id={`${title}-${item.value}`}
                checked={selectedItems.includes(item.value)}
                onCheckedChange={() => onSelectionChange(item.value)}
              />
              <Label
                htmlFor={`${title}-${item.value}`}
                className="w-full cursor-pointer font-normal"
              >
                {renderLabel ? renderLabel(item) : item.label}
              </Label>
            </div>
          ))}
        </div>
      </ScrollArea>
    </AccordionContent>
  </AccordionItem>
)

export function ExpensesFilters({
  filters,
  onFilterChange,
  onClearFilters,
  months,
  years,
}: ExpensesFiltersProps) {
  const { categories, accounts } = useSettings()

  const handleClearFilters = () => {
    onClearFilters()
  }

  const hasActiveFilters =
    filters.year.length > 0 ||
    filters.month.length > 0 ||
    filters.category.length > 0 ||
    filters.accountId.length > 0

  if (!categories || !accounts) {
    return <Skeleton className="h-40 w-full" />
  }

  return (
    <div className="flex flex-col gap-4">
      <Accordion
        type="multiple"
        className="w-full"
        defaultValue={["years", "months", "categories", "accounts"]}
      >
        <FilterSection
          title="Years"
          items={years}
          selectedItems={filters.year}
          onSelectionChange={(value) => onFilterChange("year", value)}
        />
        <FilterSection
          title="Months"
          items={months}
          selectedItems={filters.month}
          onSelectionChange={(value) => onFilterChange("month", value)}
        />
        <FilterSection
          title="Categories"
          items={categories || []}
          selectedItems={filters.category}
          onSelectionChange={(value) => onFilterChange("category", value)}
        />
        <FilterSection
          title="Accounts"
          items={accounts || []}
          selectedItems={filters.accountId}
          onSelectionChange={(value) => onFilterChange("accountId", value)}
          renderLabel={(item) => `${item.label} (${item.owner})`}
        />
      </Accordion>
      <Button
        variant="ghost"
        onClick={handleClearFilters}
        className="w-full justify-center"
        disabled={!hasActiveFilters}
      >
        <X className="mr-2 h-4 w-4" />
        Clear Filters
      </Button>
    </div>
  )
}
