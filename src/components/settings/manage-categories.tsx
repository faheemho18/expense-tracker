
"use client"

import * as React from "react"
import { Edit, PlusCircle, Trash2 } from "lucide-react"

import { useSettings } from "@/contexts/settings-context"
import { ICONS, type IconName } from "@/lib/constants"
import type { Category } from "@/lib/types"
import { getIcon } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

export function ManageCategories() {
  const { categories, setCategories } = useSettings()
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(
    null
  )
  const [categoryToDelete, setCategoryToDelete] =
    React.useState<Category | null>(null)

  // Form state for dialog
  const [label, setLabel] = React.useState("")
  const [icon, setIcon] = React.useState<IconName | "">("")

  const resetForm = () => {
    setLabel("")
    setIcon("")
  }

  const handleAddClick = () => {
    setEditingCategory(null)
    resetForm()
    setIsFormDialogOpen(true)
  }

  const handleEditClick = (category: Category) => {
    setEditingCategory(category)
    setLabel(category.label)
    setIcon(category.icon as IconName)
    setIsFormDialogOpen(true)
  }

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category)
  }

  const handleDeleteConfirm = () => {
    if (categoryToDelete) {
      setCategories((cats) =>
        (cats || []).filter((c) => c.value !== categoryToDelete.value)
      )
      setCategoryToDelete(null)
    }
  }

  const handleSave = () => {
    if (!label || !icon) return

    if (editingCategory) {
      setCategories((cats) =>
        (cats || []).map((c) =>
          c.value === editingCategory.value ? { ...c, label, icon } : c
        )
      )
    } else {
      const newCategory: Category = {
        value: label.toLowerCase().replace(/\s+/g, "-"),
        label,
        icon,
        color: "#888888", // Default color
        budget: undefined,
      }
      setCategories((cats) => [...(cats || []), newCategory])
    }
    setIsFormDialogOpen(false)
  }

  const handleBudgetChange = (categoryValue: string, budgetStr: string) => {
    const budgetAmount = parseFloat(budgetStr)
    setCategories((cats) =>
      (cats || []).map((c) => {
        if (c.value === categoryValue) {
          // if empty, budget is undefined. if not a number or negative, keep existing budget. otherwise update.
          const newBudget =
            budgetStr === ""
              ? undefined
              : !isNaN(budgetAmount) && budgetAmount >= 0
                ? budgetAmount
                : c.budget
          return { ...c, budget: newBudget }
        }
        return c
      })
    )
  }

  const handleColorChange = (categoryValue: string, newColor: string) => {
    setCategories((cats) =>
      (cats || []).map((c) =>
        c.value === categoryValue ? { ...c, color: newColor } : c
      )
    )
  }

  if (!categories) {
    return <Skeleton className="h-48 w-full" />
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAddClick}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>
      <div className="rounded-md border">
        <ul className="divide-y divide-border">
          {categories.map((category) => {
            const Icon = getIcon(category.icon)
            return (
              <li
                key={category.value}
                className="flex items-center gap-4 p-4"
              >
                <Icon
                  className="h-5 w-5 flex-shrink-0"
                  style={{ color: category.color }}
                />
                <div className="flex-1 font-medium">{category.label}</div>

                <div className="flex items-center gap-2">
                  <Label
                    htmlFor={`budget-${category.value}`}
                    className="sr-only"
                  >
                    Budget
                  </Label>
                  <Input
                    id={`budget-${category.value}`}
                    type="number"
                    min="0"
                    value={(category.budget ?? "").toString()}
                    onChange={(e) =>
                      handleBudgetChange(category.value, e.target.value)
                    }
                    placeholder="Budget"
                    className="w-28"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Label
                    htmlFor={`color-${category.value}`}
                    className="sr-only"
                  >
                    Color
                  </Label>
                  <Input
                    id={`color-${category.value}`}
                    type="color"
                    value={category.color}
                    onChange={(e) =>
                      handleColorChange(category.value, e.target.value)
                    }
                    className="h-10 w-10 cursor-pointer p-1"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditClick(category)}
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit name and icon</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(category)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Delete category</span>
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit" : "Add"} Category
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Edit the name and icon for your category."
                : "Add a new category to your list. Budget and color can be set inline."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-label">Label</Label>
              <Input
                id="category-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Groceries"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-icon">Icon</Label>
              <Select
                onValueChange={(value) => setIcon(value as IconName)}
                value={icon}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an icon" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(ICONS).map((iconName) => {
                    const Icon = getIcon(iconName)
                    return (
                      <SelectItem key={iconName} value={iconName}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{iconName}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFormDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              category "{categoryToDelete?.label}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
