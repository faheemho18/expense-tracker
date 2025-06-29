
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
  const [newCategoryLabel, setNewCategoryLabel] = React.useState("")
  const [newCategoryIcon, setNewCategoryIcon] = React.useState<IconName | "">(
    ""
  )

  const handleAddClick = () => {
    setEditingCategory(null)
    setNewCategoryLabel("")
    setNewCategoryIcon("")
    setIsFormDialogOpen(true)
  }

  const handleEditClick = (category: Category) => {
    setEditingCategory(category)
    setNewCategoryLabel(category.label)
    setNewCategoryIcon(category.icon as IconName)
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
    if (!newCategoryLabel || !newCategoryIcon) return

    if (editingCategory) {
      setCategories((cats) =>
        (cats || []).map((c) =>
          c.value === editingCategory.value
            ? { ...c, label: newCategoryLabel, icon: newCategoryIcon }
            : c
        )
      )
    } else {
      const newCategory: Category = {
        value: newCategoryLabel.toLowerCase().replace(/\s+/g, "-"),
        label: newCategoryLabel,
        icon: newCategoryIcon,
      }
      setCategories((cats) => [...(cats || []), newCategory])
    }
    setIsFormDialogOpen(false)
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
              <li key={category.value} className="flex items-center p-4">
                <Icon className="mr-4 h-5 w-5" />
                <span className="flex-1 font-medium">{category.label}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditClick(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(category)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
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
                ? "Edit the details of your category."
                : "Add a new category to your list."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-label">Label</Label>
              <Input
                id="category-label"
                value={newCategoryLabel}
                onChange={(e) => setNewCategoryLabel(e.target.value)}
                placeholder="e.g., Groceries"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-icon">Icon</Label>
              <Select
                onValueChange={(value) => setNewCategoryIcon(value as IconName)}
                value={newCategoryIcon}
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
