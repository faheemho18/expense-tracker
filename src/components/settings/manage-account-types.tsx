
"use client"

import * as React from "react"
import { Edit, PlusCircle, Trash2 } from "lucide-react"

import { useSettings } from "@/contexts/settings-context"
import type { AccountType } from "@/lib/types"
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

const ACCOUNT_ICONS = {
  Wallet: "Cash",
  CreditCard: "Credit Card",
}

export function ManageAccountTypes() {
  const { accountTypes, setAccountTypes } = useSettings()
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false)
  const [editingAccountType, setEditingAccountType] =
    React.useState<AccountType | null>(null)
  const [accountTypeToDelete, setAccountTypeToDelete] =
    React.useState<AccountType | null>(null)
  const [newAccountTypeLabel, setNewAccountTypeLabel] = React.useState("")
  const [newAccountTypeIcon, setNewAccountTypeIcon] = React.useState("")

  const handleAddClick = () => {
    setEditingAccountType(null)
    setNewAccountTypeLabel("")
    setNewAccountTypeIcon("")
    setIsFormDialogOpen(true)
  }

  const handleEditClick = (accountType: AccountType) => {
    setEditingAccountType(accountType)
    setNewAccountTypeLabel(accountType.label)
    setNewAccountTypeIcon(accountType.icon)
    setIsFormDialogOpen(true)
  }

  const handleDeleteClick = (accountType: AccountType) => {
    setAccountTypeToDelete(accountType)
  }

  const handleDeleteConfirm = () => {
    if (accountTypeToDelete) {
      setAccountTypes((types) =>
        (types || []).filter((t) => t.value !== accountTypeToDelete.value)
      )
      setAccountTypeToDelete(null)
    }
  }

  const handleSave = () => {
    if (!newAccountTypeLabel || !newAccountTypeIcon) return

    if (editingAccountType) {
      setAccountTypes((types) =>
        (types || []).map((t) =>
          t.value === editingAccountType.value
            ? { ...t, label: newAccountTypeLabel, icon: newAccountTypeIcon }
            : t
        )
      )
    } else {
      const newAccountType: AccountType = {
        value: newAccountTypeLabel.toLowerCase().replace(/\s+/g, "-"),
        label: newAccountTypeLabel,
        icon: newAccountTypeIcon,
      }
      setAccountTypes((types) => [...(types || []), newAccountType])
    }
    setIsFormDialogOpen(false)
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
          {accountTypes.map((accountType) => {
            const Icon = getIcon(accountType.icon)
            return (
              <li key={accountType.value} className="flex items-center p-4">
                <Icon className="mr-3 h-5 w-5" />
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
                    onClick={() => handleDeleteClick(accountType)}
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
            <div className="space-y-2">
              <Label htmlFor="account-type-icon">Icon</Label>
              <Select
                onValueChange={(value) => setNewAccountTypeIcon(value)}
                value={newAccountTypeIcon}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an icon" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACCOUNT_ICONS).map(
                    ([iconName, iconLabel]) => {
                      const Icon = getIcon(iconName)
                      return (
                        <SelectItem key={iconName} value={iconName}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{iconLabel}</span>
                          </div>
                        </SelectItem>
                      )
                    }
                  )}
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
        open={!!accountTypeToDelete}
        onOpenChange={(open) => !open && setAccountTypeToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              account type "{accountTypeToDelete?.label}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAccountTypeToDelete(null)}>
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
