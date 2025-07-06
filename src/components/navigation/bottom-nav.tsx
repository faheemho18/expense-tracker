"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Database,
  LayoutDashboard,
  Palette,
  Settings,
  Wallet,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

const navigationItems = [
  { href: "/", label: "Expenses", icon: Wallet },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/data", label: "Data", icon: Database },
  { href: "/themes", label: "Themes", icon: Palette },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()
  const isMobile = useIsMobile()

  // Only show on mobile
  if (!isMobile) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md">
      <nav className="flex h-16 items-center justify-around px-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 px-2 py-1 text-xs font-medium transition-colors touch-feedback",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon 
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} 
              />
              <span className="text-[10px] leading-tight">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}