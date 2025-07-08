
"use client"

import * as React from "react"
import { Edit, PlusCircle, Trash2 } from "lucide-react"

import { useSettings } from "@/contexts/settings-context"
import { ACCOUNT_OWNERS, type IconName } from "@/lib/constants"
import type { Account, AccountOwner } from "@/lib/types"
import { getIcon } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
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

const ACCOUNT_ICONS: IconName[] = ["Wallet", "CreditCard", "Landmark", "Banknote"]

export function ManageAccounts() {
  const { accounts, setAccounts } = useSettings()
  const isMobile = useIsMobile()
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false)
  const [editingAccount, setEditingAccount] =
    React.useState<Account | null>(null)
  const [accountToDelete, setAccountToDelete] =
    React.useState<Account | null>(null)

  // Form state
  const [label, setLabel] = React.useState("")
  const [owner, setOwner] = React.useState<AccountOwner | "">("")
  const [icon, setIcon] = React.useState<IconName | "">("")

  const resetForm = () => {
    setLabel("")
    setOwner("")
    setIcon("")
  }

  const handleAddClick = () => {
    setEditingAccount(null)
    resetForm()
    setIsFormDialogOpen(true)
  }

  const handleEditClick = (account: Account) => {
    setEditingAccount(account)
    setLabel(account.label)
    setOwner(account.owner)
    setIcon(account.icon as IconName)
    setIsFormDialogOpen(true)
  }

  const handleDeleteClick = (account: Account) => {
    setAccountToDelete(account)
  }

  const handleDeleteConfirm = () => {
    if (accountToDelete) {
      setAccounts((currentAccounts) =>
        (currentAccounts || []).filter((a) => a.value !== accountToDelete.value)
      )
      setAccountToDelete(null)
    }
  }

  const handleSave = () => {
    if (!label || !icon || !owner) return

    if (editingAccount) {
      setAccounts((currentAccounts) =>
        (currentAccounts || []).map((acc) =>
          acc.value === editingAccount.value
            ? { ...acc, label, owner, icon }
            : acc
        )
      )
    } else {
      const newAccount: Account = {
        value: label.toLowerCase().replace(/\s+/g, "-"),
        label,
        owner,
        icon,
      }
      setAccounts((currentAccounts) => [...(currentAccounts || []), newAccount])
    }
    setIsFormDialogOpen(false)
  }

  if (!accounts) {
    return <Skeleton className="h-48 w-full" />
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAddClick}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Account
        </Button>
      </div>
      <div className="rounded-md border">
        {!isMobile && (
          // Desktop header - only show on desktop
          <div className="flex items-center justify-between border-b p-4 text-sm font-medium text-muted-foreground">
            <div className="flex items-center gap-x-12">
              <div className="w-64">Account</div>
              <div>Owner</div>
            </div>
            <div className="w-[88px] text-right">Actions</div>
          </div>
        )}
        <div className="space-y-0">
          {accounts.map((account) => {
            const Icon = getIcon(account.icon)
            return (
              <div
                key={account.value}
                className="border-b last:border-b-0 bg-card p-4"
              >
                {isMobile ? (
                  // Mobile layout: vertical stacking
                  <div className="space-y-3">
                    {/* Header with icon, account name, and actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium text-base">
                            {account.label}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(account)}
                          className="h-9 w-9 p-0"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit account</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(account)}
                          className="h-9 w-9 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Delete account</span>
                        </Button>
                      </div>
                    </div>
                    
                    {/* Owner information */}
                    <div className="pl-8">
                      <div className="text-sm text-muted-foreground">Owner</div>
                      <div className="text-sm font-medium">{account.owner}</div>
                    </div>
                  </div>
                ) : (
                  // Desktop layout: horizontal table-like layout
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-x-12">
                      <div className="flex w-64 items-center">
                        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span className="truncate font-medium">
                          {account.label}
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        <span>{account.owner}</span>
                      </div>
                    </div>
                    <div className="flex w-[88px] items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(account)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit account</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(account)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Delete account</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? "Edit" : "Add"} Account
            </DialogTitle>
            <DialogDescription>
              {editingAccount
                ? "Edit the details of your account."
                : "Add a new account to your list."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="account-label">Account Label</Label>
              <Input
                id="account-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Savings Account"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-owner">Account Owner</Label>
              <Select
                onValueChange={(value) => setOwner(value as AccountOwner)}
                value={owner}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an owner" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_OWNERS.map((ownerName) => (
                    <SelectItem key={ownerName} value={ownerName}>
                      {ownerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-icon">Icon</Label>
              <Select
                onValueChange={(value) => setIcon(value as IconName)}
                value={icon}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an icon" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_ICONS.map((iconName) => {
                      const Icon = getIcon(iconName)
                      return (
                        <SelectItem key={iconName} value={iconName}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{iconName}</span>
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
        open={!!accountToDelete}
        onOpenChange={(open) => !open && setAccountToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              account "{accountToDelete?.label}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAccountToDelete(null)}>
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
