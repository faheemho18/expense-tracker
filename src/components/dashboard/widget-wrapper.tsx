"use client"

import { MoreVertical, Trash } from "lucide-react"

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
}

export function WidgetWrapper({
  widget,
  removeWidget,
  children,
  className,
  ...props
}: WidgetWrapperProps) {
  return (
    <Card className={cn("flex flex-col", className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-medium">{widget.title}</CardTitle>
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
      <CardContent className="flex-1 h-[350px]">
        {children}
      </CardContent>
    </Card>
  )
}
