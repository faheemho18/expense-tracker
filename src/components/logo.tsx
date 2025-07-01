
"use client"

import { ScanEye } from "lucide-react"

import { useSidebar } from "@/components/ui/sidebar"

export function Logo() {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      onClick={toggleSidebar}
      className="flex w-full cursor-pointer items-center gap-3 overflow-hidden p-2 text-lg font-semibold text-sidebar-foreground transition-[gap] duration-200 ease-in-out group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
    >
      <div className="dark:bg-primary dark:text-primary-foreground bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center p-2 rounded-lg">
        <ScanEye className="h-6 w-6" />
      </div>
      <span className="whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-200 ease-in-out group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0">
        Expense Gazer
      </span>
    </button>
  )
}
