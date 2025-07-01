"use client"

import { ScanEye } from "lucide-react"

import { useSidebar } from "@/components/ui/sidebar"

export function Logo() {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      onClick={toggleSidebar}
      className="flex w-full cursor-pointer items-center gap-3 p-2 font-semibold text-lg text-sidebar-foreground group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:gap-0"
    >
      <div className="dark:bg-primary dark:text-primary-foreground bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center p-2 rounded-lg">
        <ScanEye className="h-6 w-6" />
      </div>
      <span className="group-data-[collapsible=icon]:hidden">
        Expense Gazer
      </span>
    </button>
  )
}
