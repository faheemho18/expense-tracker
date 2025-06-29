"use client"

import * as React from "react"
import { GripVertical, MoreVertical, Trash } from "lucide-react"
import type { DraggableProvided } from "react-beautiful-dnd"

import type { WidgetConfig } from "@/lib/types"

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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface WidgetWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  widget: WidgetConfig
  removeWidget: (id: string) => void
  children: React.ReactNode
  isDragging?: boolean
  draggableProps: DraggableProvided["draggableProps"]
  dragHandleProps: DraggableProvided["dragHandleProps"] | null | undefined
}

export const WidgetWrapper = React.forwardRef<
  HTMLDivElement,
  WidgetWrapperProps
>(
  (
    {
      widget,
      removeWidget,
      children,
      className,
      isDragging,
      draggableProps,
      dragHandleProps,
      ...props
    },
    ref
  ) => {
    return (
      <Card
        ref={ref}
        {...draggableProps}
        {...props}
        className={cn(
          "flex flex-col transition-shadow",
          isDragging && "shadow-2xl ring-2 ring-primary",
          className
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div
            {...dragHandleProps}
            className="flex items-center gap-2 cursor-grab"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base font-medium">
              {widget.title}
            </CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
        <CardContent className="flex-1 h-[350px]">{children}</CardContent>
      </Card>
    )
  }
)
WidgetWrapper.displayName = "WidgetWrapper"
