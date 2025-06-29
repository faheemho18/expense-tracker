
"use client"

import * as React from "react"

import { useSettings } from "@/contexts/settings-context"
import type { CategoryThreshold } from "@/lib/types"
import { getIcon } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"

export function ManageCategoryThresholds() {
  const { categories, categoryThresholds, setCategoryThresholds } = useSettings()
  const [thresholds, setThresholds] = React.useState<Record<string, number>>({})

  React.useEffect(() => {
    if (categoryThresholds) {
      const initialThresholds = categoryThresholds.reduce(
        (acc, item) => {
          acc[item.categoryValue] = item.threshold
          return acc
        },
        {} as Record<string, number>
      )
      setThresholds(initialThresholds)
    }
  }, [categoryThresholds])

  const handleThresholdChange = (categoryValue: string, value: string) => {
    const amount = Number(value)
    setThresholds((prev) => ({
      ...prev,
      [categoryValue]: isNaN(amount) ? 0 : amount,
    }))
  }

  const handleSave = () => {
    const newThresholds: CategoryThreshold[] = Object.entries(thresholds)
      .filter(([, threshold]) => threshold > 0)
      .map(([categoryValue, threshold]) => ({
        categoryValue,
        threshold,
      }))
    setCategoryThresholds(newThresholds)
    toast({
      title: "Budgets Saved",
      description: "Your category budgets have been updated.",
    })
  }

  if (!categories || !categoryThresholds) {
    return <Skeleton className="h-48 w-full" />
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {categories.map((category) => {
          const Icon = getIcon(category.icon)
          return (
            <div
              key={category.value}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <Label
                  htmlFor={`threshold-${category.value}`}
                  className="font-medium"
                >
                  {category.label}
                </Label>
              </div>
              <Input
                id={`threshold-${category.value}`}
                type="number"
                value={thresholds[category.value] || ""}
                onChange={(e) =>
                  handleThresholdChange(category.value, e.target.value)
                }
                placeholder="e.g., 5000"
                className="w-48"
              />
            </div>
          )
        })}
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Budgets</Button>
      </div>
    </div>
  )
}
