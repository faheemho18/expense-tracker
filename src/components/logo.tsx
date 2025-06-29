import { ScanEye } from "lucide-react"

export function Logo() {
  return (
    <div className="flex items-center gap-3 p-2 font-semibold text-lg">
      <div className="dark:bg-primary dark:text-primary-foreground bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center p-2 rounded-lg">
        <ScanEye className="h-6 w-6" />
      </div>
      <span className="group-data-[collapsible=icon]:hidden">
        Expense Gazer
      </span>
    </div>
  )
}
