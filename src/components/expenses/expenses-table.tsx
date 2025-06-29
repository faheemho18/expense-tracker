
"use client"

import * as React from "react"
import { format } from "date-fns"
import {
  MoreHorizontal,
  Trash2,
  FileImage,
  Edit,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
} from "lucide-react"

import { useSettings } from "@/contexts/settings-context"
import type { Expense } from "@/lib/types"
import { cn, formatCurrency, getIcon } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type SortableKey =
  | "date"
  | "description"
  | "category"
  | "accountType"
  | "amount"
type SortDirection = "ascending" | "descending"

interface ExpensesTableProps {
  expenses: Expense[]
  deleteExpense: (id: string) => void
  editExpense: (expense: Expense) => void
  sortConfig: {
    key: SortableKey
    direction: SortDirection
  } | null
  requestSort: (key: SortableKey) => void
}

export function ExpensesTable({
  expenses,
  deleteExpense,
  editExpense,
  sortConfig,
  requestSort,
}: ExpensesTableProps) {
  const { categories, accountTypes } = useSettings()

  const getCategory = React.useCallback(
    (value: string) => {
      return (categories || []).find((c) => c.value === value)
    },
    [categories]
  )

  const getAccountType = React.useCallback(
    (value: string) => {
      return (accountTypes || []).find((a) => a.value === value)
    },
    [accountTypes]
  )

  const getSortIcon = (key: SortableKey) => {
    if (!sortConfig) {
      // Default sort (date descending)
      if (key === "date") {
        return <ArrowDown className="ml-2 h-4 w-4" />
      }
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    if (sortConfig.direction === "ascending") {
      return <ArrowUp className="ml-2 h-4 w-4" />
    }
    return <ArrowDown className="ml-2 h-4 w-4" />
  }

  if (!categories || !accountTypes) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  return (
    <div className="w-full overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="p-0">
              <Button
                variant="ghost"
                onClick={() => requestSort("date")}
                className="w-full justify-start px-4 font-medium"
              >
                Date
                {getSortIcon("date")}
              </Button>
            </TableHead>
            <TableHead className="p-0">
              <Button
                variant="ghost"
                onClick={() => requestSort("description")}
                className="w-full justify-start px-4 font-medium"
              >
                Description
                {getSortIcon("description")}
              </Button>
            </TableHead>
            <TableHead className="p-0 text-center">
              <Button
                variant="ghost"
                onClick={() => requestSort("category")}
                className="w-full justify-center px-4 font-medium"
              >
                Category
                {getSortIcon("category")}
              </Button>
            </TableHead>
            <TableHead className="p-0 text-center">
              <Button
                variant="ghost"
                onClick={() => requestSort("accountType")}
                className="w-full justify-center px-4 font-medium"
              >
                Account
                {getSortIcon("accountType")}
              </Button>
            </TableHead>
            <TableHead className="p-0 text-right">
              <Button
                variant="ghost"
                onClick={() => requestSort("amount")}
                className="w-full justify-end px-4 font-medium"
              >
                Amount
                {getSortIcon("amount")}
              </Button>
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.length > 0 ? (
            expenses.map((expense) => {
              const category = getCategory(expense.category)
              const CategoryIcon = category ? getIcon(category.icon) : null

              const accountType = getAccountType(expense.accountType)
              const AccountIcon = accountType
                ? getIcon(accountType.icon)
                : null
              return (
                <TableRow key={expense.id}>
                  <TableCell>
                    {format(new Date(expense.date), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1.5">
                      <span>{expense.description}</span>
                      {expense.receiptImage && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                            >
                              <FileImage className="h-4 w-4" />
                              <span className="sr-only">View Receipt</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-xl">
                            <DialogHeader>
                              <DialogTitle>
                                Receipt for "{expense.description}"
                              </DialogTitle>
                            </DialogHeader>
                            <img
                              src={expense.receiptImage}
                              alt={`Receipt for ${expense.description}`}
                              className="h-auto w-full rounded-md object-contain"
                            />
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {category && (
                      <Badge
                        variant="outline"
                        className="inline-flex gap-2 whitespace-nowrap"
                      >
                        {CategoryIcon && (
                          <CategoryIcon
                            className="h-4 w-4"
                            color={category.color}
                          />
                        )}
                        {category.label}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {accountType ? (
                      <div className="inline-flex items-center gap-2">
                        {AccountIcon && (
                          <AccountIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>{accountType.label}</span>
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "font-mono text-right",
                      expense.amount < 0
                        ? "text-emerald-500"
                        : "text-foreground"
                    )}
                  >
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => editExpense(expense)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteExpense(expense.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No expenses found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
