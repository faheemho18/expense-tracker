
"use client"

import * as React from "react"
import { Edit, Filter, MoreVertical, Trash, GripVertical } from "lucide-react"

import type { WidgetConfig, WidgetFilters } from "@/lib/types"

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

interface WidgetWrapperProps {
  widget: WidgetConfig
  removeWidget: (id: string) => void
  updateWidgetTitle: (id: string, title: string) => void
  children: React.ReactNode
  updateWidgetFilters: (id: string, filters: WidgetFilters) => void
  availableMonths: { value: string; label: string }[]
  availableYears: { value: string; label: string }[]
}

export function WidgetWrapper({
  widget,
  removeWidget,
  updateWidgetTitle,
  children,
  updateWidgetFilters,
  availableMonths,
  availableYears,
}: WidgetWrapperProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = React.useState(false)

  return (
    <Card className="flex h-full w-full flex-col transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center border-b p-4">
        <div className="drag-handle cursor-move pr-2 text-muted-foreground">
          <GripVertical className="h-5 w-5" />
        </div>
        <div className="flex flex-1 items-center gap-2">
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
      <CardContent className="min-h-0 flex-1 p-0">{children}</CardContent>
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
    </Card>
  )
}
