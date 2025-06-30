
"use client"

import * as React from "react"
import { Edit, Filter, Grip, MoreVertical, Trash } from "lucide-react"

import type { WidgetConfig, WidgetFilters } from "@/lib/types"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditWidgetDialog } from "./edit-widget-dialog"
import { WidgetFiltersSheet } from "./widget-filters-sheet"

interface WidgetWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  widget: WidgetConfig
  removeWidget: (id: string) => void
  updateWidgetTitle: (id: string, title: string) => void
  children: React.ReactNode
  updateWidgetFilters: (id: string, filters: WidgetFilters) => void
  availableMonths: { value: string; label: string }[]
  availableYears: { value: string; label: string }[]
}

export const WidgetWrapper = React.forwardRef<
  HTMLDivElement,
  WidgetWrapperProps
>(
  (
    {
      widget,
      removeWidget,
      updateWidgetTitle,
      children,
      className,
      updateWidgetFilters,
      availableMonths,
      availableYears,
      ...props
    },
    ref
  ) => {
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
    const [isFilterSheetOpen, setIsFilterSheetOpen] = React.useState(false)

    return (
      <div ref={ref} {...props} className={className}>
        <Card className="flex h-full w-full flex-col transition-shadow">
          <CardHeader className="flex flex-row items-center border-b p-4">
            <div className="drag-handle flex flex-1 cursor-grab items-center gap-2">
              <Grip className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base font-medium">
                {widget.title}
              </CardTitle>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit title
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsFilterSheetOpen(true)}>
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => removeWidget(widget.id)}
                  className="text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Remove widget
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 p-4">{children}</CardContent>
        </Card>
        <EditWidgetDialog
          isOpen={isEditDialogOpen}
          setIsOpen={setIsEditDialogOpen}
          widget={widget}
          updateWidgetTitle={updateWidgetTitle}
        />
        <WidgetFiltersSheet
          isOpen={isFilterSheetOpen}
          setIsOpen={setIsFilterSheetOpen}
          widget={widget}
          updateWidgetFilters={updateWidgetFilters}
          months={availableMonths}
          years={availableYears}
        />
      </div>
    )
  }
)
WidgetWrapper.displayName = "WidgetWrapper"
