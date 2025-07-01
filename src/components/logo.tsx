"use client"

import { Banknote } from "lucide-react"

import { useSidebar } from "@/components/ui/sidebar"

export function Logo() {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      onClick={toggleSidebar}
      className="flex h-10 w-full cursor-pointer items-center gap-2 overflow-hidden p-2 text-lg font-semibold text-sidebar-foreground transition-[width,padding,gap] duration-200 ease-in-out group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
    >
      <div className="dark:bg-primary dark:text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
        <Banknote className="h-4 w-4" />
      </div>
      <span className="whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-200 ease-in-out group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0">
        Expense Tracker
      </span>
    </button>
  )
}
