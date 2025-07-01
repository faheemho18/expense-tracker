
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

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/logo"
import { useIsMobile } from "@/hooks/use-mobile"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isMobile = useIsMobile()

  const isActive = React.useCallback(
    (path: string) => {
      return pathname === path
    },
    [pathname]
  )

  const expensesTooltip = React.useMemo(() => ({ children: "Expenses" }), [])
  const dashboardTooltip = React.useMemo(
    () => ({ children: "Dashboard" }),
    []
  )
  const dataTooltip = React.useMemo(() => ({ children: "Import/Export" }), [])
  const settingsTooltip = React.useMemo(() => ({ children: "Settings" }), [])
  const themesTooltip = React.useMemo(() => ({ children: "Themes" }), [])

  return (
    <SidebarProvider>
      <Sidebar collapsible={isMobile ? "offcanvas" : "icon"}>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive("/")}
                tooltip={expensesTooltip}
              >
                <Link href="/">
                  <Wallet />
                  <span className="whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-200 ease-in-out group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0">
                    Expenses
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive("/dashboard")}
                tooltip={dashboardTooltip}
              >
                <Link href="/dashboard">
                  <LayoutDashboard />
                  <span className="whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-200 ease-in-out group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0">
                    Dashboard
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive("/data")}
                tooltip={dataTooltip}
              >
                <Link href="/data">
                  <Database />
                  <span className="whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-200 ease-in-out group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0">
                    Data
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive("/themes")}
                tooltip={themesTooltip}
              >
                <Link href="/themes">
                  <Palette />
                  <span className="whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-200 ease-in-out group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0">
                    Themes
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive("/settings")}
                tooltip={settingsTooltip}
              >
                <Link href="/settings">
                  <Settings />
                  <span className="whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-200 ease-in-out group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0">
                    Settings
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          {/* You can add a user profile or settings link here */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            {/* You can add a page title or breadcrumbs here */}
          </div>
        </header>
        <main>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
