
"use client"

import * as React from "react"
import { Edit, PlusCircle, Trash2 } from "lucide-react"

import { useSettings } from "@/contexts/settings-context"
import type { AccountType } from "@/lib/types"
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
import { Skeleton } from "@/components/ui/skeleton"

export function ManageAccountTypes() {
  const { accountTypes, setAccountTypes } = useSettings()
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingAccountType, setEditingAccountType] =
    React.useState<AccountType | null>(null)
  const [newAccountTypeLabel, setNewAccountTypeLabel] = React.useState("")

  const handleAddClick = () => {
    setEditingAccountType(null)
    setNewAccountTypeLabel("")
    setIsDialogOpen(true)
  }

  const handleEditClick = (accountType: AccountType) => {
    setEditingAccountType(accountType)
    setNewAccountTypeLabel(accountType.label)
    setIsDialogOpen(true)
  }

  const handleDelete = (value: string) => {
    setAccountTypes((types) =>
      (types || []).filter((t) => t.value !== value)
    )
  }

  const handleSave = () => {
    if (!newAccountTypeLabel) return

    if (editingAccountType) {
      setAccountTypes((types) =>
        (types || []).map((t) =>
          t.value === editingAccountType.value
            ? { ...t, label: newAccountTypeLabel }
            : t
        )
      )
    } else {
      const newAccountType: AccountType = {
        value: newAccountTypeLabel.toLowerCase().replace(/\s+/g, "-"),
        label: newAccountTypeLabel,
      }
      setAccountTypes((types) => [...(types || []), newAccountType])
    }
    setIsDialogOpen(false)
  }

  if (!accountTypes) {
    return <Skeleton className="h-48 w-full" />
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAddClick}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Account Type
        </Button>
      </div>
      <div className="rounded-md border">
        <ul className="divide-y divide-border">
          {accountTypes.map((accountType) => (
            <li key={accountType.value} className="flex items-center p-4">
              <span className="flex-1 font-medium">{accountType.label}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEditClick(accountType)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(accountType.value)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAccountType ? "Edit" : "Add"} Account Type
            </DialogTitle>
            <DialogDescription>
              {editingAccountType
                ? "Edit the details of your account type."
                : "Add a new account type to your list."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="account-type-label">Label</Label>
              <Input
                id="account-type-label"
                value={newAccountTypeLabel}
                onChange={(e) => setNewAccountTypeLabel(e.target.value)}
                placeholder="e.g., Savings Account"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
