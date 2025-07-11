
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
import { useSwipeGesture, useLongPress } from "@/hooks/use-touch-gestures"
import { useIsMobile, useHapticFeedback } from "@/hooks/use-mobile"
import { TOUCH_CLASSES } from "@/utils/mobile-utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BlurFade } from "@/components/magicui/blur-fade"
import { CurrencyTicker } from "@/components/ui/currency-ticker"
import { ImageViewer } from "@/components/ui/image-viewer"
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
  | "account"
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
  const { categories, accounts } = useSettings()
  const isMobile = useIsMobile()
  const { vibrate } = useHapticFeedback()
  const [swipingExpenseId, setSwipingExpenseId] = React.useState<string | null>(null)
  const [longPressMenuId, setLongPressMenuId] = React.useState<string | null>(null)

  const getCategory = React.useCallback(
    (value: string) => {
      return (categories || []).find((c) => c.value === value)
    },
    [categories]
  )

  const getAccount = React.useCallback(
    (value: string) => {
      return (accounts || []).find((a) => a.value === value)
    },
    [accounts]
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

  // Remove skeleton loading - components should render with default data

  // Mobile card component with swipe gestures
  const MobileExpenseCard = React.memo(({ expense, index }: { expense: Expense; index: number }) => {
    const category = getCategory(expense.category)
    const CategoryIcon = category ? getIcon(category.icon) : null
    const account = getAccount(expense.accountTypeId)
    const AccountIcon = account ? getIcon(account.icon) : null

    const swipeGesture = useSwipeGesture((gesture) => {
      if (gesture.direction === 'left') {
        // Swipe left to delete
        if (isMobile) {
          vibrate(100)
        }
        deleteExpense(expense.id)
      } else if (gesture.direction === 'right') {
        // Swipe right to edit
        if (isMobile) {
          vibrate(50)
        }
        editExpense(expense)
      }
    }, {
      swipeThreshold: 80,
      velocityThreshold: 0.3,
    })

    const longPressGesture = useLongPress(() => {
      if (isMobile) {
        vibrate(75) // Haptic feedback for long press
        setLongPressMenuId(expense.id)
      }
    }, {
      longPressDelay: 500,
      tapTolerance: 10,
    })

    return (
      <BlurFade key={`mobile-${expense.id}`} delay={0.05 + index * 0.05} inView>
        <div 
          className={cn(
            "rounded-lg border bg-card shadow-sm relative overflow-hidden",
            TOUCH_CLASSES.TOUCH_MANIPULATION,
            swipingExpenseId === expense.id ? "scale-95" : "scale-100",
            "transition-transform duration-200"
          )}
          onTouchStart={(e) => {
            setSwipingExpenseId(expense.id)
            swipeGesture.onTouchStart(e.nativeEvent)
            longPressGesture.onTouchStart(e.nativeEvent)
          }}
          onTouchMove={(e) => {
            longPressGesture.onTouchMove?.(e.nativeEvent)
          }}
          onTouchEnd={(e) => {
            setSwipingExpenseId(null)
            swipeGesture.onTouchEnd(e.nativeEvent)
            longPressGesture.onTouchEnd?.()
          }}
          onMouseDown={(e) => {
            longPressGesture.onMouseDown?.(e.nativeEvent)
          }}
          onMouseMove={(e) => {
            longPressGesture.onMouseMove?.(e.nativeEvent)
          }}
          onMouseUp={(e) => {
            longPressGesture.onMouseUp?.()
          }}
          onMouseLeave={(e) => {
            longPressGesture.onMouseLeave?.()
          }}
        >
          {/* Swipe hints */}
          <div className="absolute inset-0 flex">
            <div className="flex-1 flex items-center justify-start pl-4 bg-emerald-500/10">
              <Edit className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1 flex items-center justify-end pr-4 bg-destructive/10">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
          </div>
          
          {/* Card content */}
          <div className="relative bg-card p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-lg truncate pr-2">{expense.description}</p>
                  <div className="text-right">
                    <CurrencyTicker
                      value={expense.amount}
                      delay={0.1 + index * 0.05}
                      className={cn(
                        "text-lg font-bold tabular-nums",
                        expense.amount >= 0
                          ? "text-destructive"
                          : "text-emerald-600"
                      )}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{format(new Date(expense.date), "MMM dd, yyyy")}</span>
                  {expense.receiptImage && (
                    <ImageViewer
                      src={expense.receiptImage}
                      alt={`Receipt for ${expense.description}`}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-8 w-8",
                            TOUCH_CLASSES.TOUCH_TARGET,
                            TOUCH_CLASSES.TOUCH_FEEDBACK
                          )}
                        >
                          <FileImage className="h-4 w-4" />
                          <span className="sr-only">View Receipt</span>
                        </Button>
                      }
                    />
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {CategoryIcon && (
                      <div className="flex items-center gap-1">
                        <CategoryIcon className="h-4 w-4" />
                        <Badge variant="secondary" className="text-xs">
                          {category?.label}
                        </Badge>
                      </div>
                    )}
                    {AccountIcon && (
                      <div className="flex items-center gap-1">
                        <AccountIcon className="h-4 w-4" />
                        <Badge variant="outline" className="text-xs">
                          {account?.label}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "h-9 w-9 p-0",
                          TOUCH_CLASSES.TOUCH_TARGET,
                          TOUCH_CLASSES.TOUCH_FEEDBACK
                        )}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => {
                          editExpense(expense)
                          if (isMobile) {
                            vibrate(50)
                          }
                        }}
                        className={cn(
                          TOUCH_CLASSES.TOUCH_TARGET,
                          "cursor-pointer"
                        )}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          deleteExpense(expense.id)
                          if (isMobile) {
                            vibrate(100)
                          }
                        }}
                        className={cn(
                          TOUCH_CLASSES.TOUCH_TARGET,
                          "text-destructive cursor-pointer"
                        )}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
            
            {/* Swipe instruction hint */}
            {index === 0 && expenses.length === 1 && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground text-center">
                  Swipe right to edit • Swipe left to delete • Long press for menu
                </p>
              </div>
            )}
          </div>

          {/* Long-press context menu */}
          {longPressMenuId === expense.id && (
            <div 
              className="absolute inset-0 bg-black/50 flex items-center justify-center z-20 rounded-lg"
              onClick={() => setLongPressMenuId(null)}
            >
              <div className="bg-card border rounded-lg shadow-lg p-2 space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    editExpense(expense)
                    setLongPressMenuId(null)
                    if (isMobile) vibrate(50)
                  }}
                  className="w-full justify-start h-11"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    deleteExpense(expense.id)
                    setLongPressMenuId(null)
                    if (isMobile) vibrate(100)
                  }}
                  className="w-full justify-start text-destructive hover:text-destructive h-11"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      </BlurFade>
    )
  })

  return (
    <div className="w-full overflow-x-auto">
      <div className="w-full overflow-hidden rounded-md border">
        {/* Mobile view - hidden on sm and larger screens */}
        <div className="sm:hidden">
        <div className="space-y-3 p-4">
          {expenses.length > 0 ? (
            expenses.map((expense, index) => (
              <MobileExpenseCard 
                key={expense.id} 
                expense={expense} 
                index={index} 
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No expenses found.
            </div>
          )}
        </div>
      </div>
      
      {/* Desktop table view - hidden on mobile, shown on sm and larger */}
      <Table className="hidden sm:table">
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
                onClick={() => requestSort("account")}
                className="w-full justify-center px-4 font-medium"
              >
                Account
                {getSortIcon("account")}
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
            expenses.map((expense, index) => {
              const category = getCategory(expense.category)
              const CategoryIcon = category ? getIcon(category.icon) : null

              const account = getAccount(expense.accountTypeId)
              const AccountIcon = account
                ? getIcon(account.icon)
                : null
              return (
                <BlurFade key={expense.id} delay={0.05 + index * 0.05} inView>
                  <TableRow>
                  <TableCell>
                    {format(new Date(expense.date), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1.5">
                      <span>{expense.description}</span>
                      {expense.receiptImage && (
                        <ImageViewer
                          src={expense.receiptImage}
                          alt={`Receipt for ${expense.description}`}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                            >
                              <FileImage className="h-4 w-4" />
                              <span className="sr-only">View Receipt</span>
                            </Button>
                          }
                        />
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
                    {account ? (
                      <div className="inline-flex items-center gap-2">
                        {AccountIcon && (
                          <AccountIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>{`${account.label} (${account.owner})`}</span>
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
                    <CurrencyTicker 
                      value={expense.amount} 
                      delay={0.1 + index * 0.05}
                      className={cn(
                        expense.amount < 0
                          ? "text-emerald-500"
                          : "text-foreground"
                      )}
                    />
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
                </BlurFade>
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
    </div>
  )
}
