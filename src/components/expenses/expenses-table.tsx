"use client"

import * as React from "react"
import { format } from "date-fns"
import { MoreHorizontal, Trash2, FileImage, Edit } from "lucide-react"

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

interface ExpensesTableProps {
  expenses: Expense[]
  deleteExpense: (id: string) => void
  editExpense: (expense: Expense) => void
}

export function ExpensesTable({
  expenses,
  deleteExpense,
  editExpense,
}: ExpensesTableProps) {
  const { categories, accountTypes } = useSettings()

  const getCategory = (value: string) => {
    return (categories || []).find((c) => c.value === value)
  }

  const getAccountType = (value: string) => {
    return (accountTypes || []).find((a) => a.value === value)
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
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Account</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.length > 0 ? (
            expenses
              .sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
              )
              .map((expense) => {
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
                    <TableCell>
                      {category && (
                        <Badge
                          variant="outline"
                          className="flex max-w-min items-center gap-2 whitespace-nowrap"
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
                    <TableCell>
                      {accountType ? (
                        <div className="flex items-center gap-2">
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
                          <DropdownMenuItem
                            onClick={() => editExpense(expense)}
                          >
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
                No expenses recorded yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
