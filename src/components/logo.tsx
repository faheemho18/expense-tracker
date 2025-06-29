import { Eye } from "lucide-react"

export function Logo() {
  return (
    <div className="flex items-center gap-2 p-2 font-semibold text-lg">
      <div className="bg-primary text-primary-foreground p-2 rounded-lg">
        <Eye className="h-6 w-6" />
      </div>
      <span className="group-data-[collapsible=icon]:hidden">
        Expense Gazer
      </span>
    </div>
  )
}
