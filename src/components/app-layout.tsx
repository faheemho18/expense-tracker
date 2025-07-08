
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
import { useAuth } from "@/contexts/auth-context"
import { UserMenu } from "@/components/auth/user-menu"
import { AuthPage } from "@/components/auth/auth-page"
import { MiniSyncStatus } from "@/components/sync/sync-status-indicator"
import { BottomNav } from "@/components/navigation/bottom-nav"
import { SwipeNavigation } from "@/components/navigation/swipe-navigation"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const { user, loading, signIn } = useAuth()

  const isActive = React.useCallback(
    (path: string) => {
      return pathname === path
    },
    [pathname]
  )

  // Pre-compute all memoized values at the top level
  const expensesTooltip = React.useMemo(() => ({ children: "Expenses" }), [])
  const dashboardTooltip = React.useMemo(
    () => ({ children: "Dashboard" }),
    []
  )
  const dataTooltip = React.useMemo(() => ({ children: "Import/Export" }), [])
  const settingsTooltip = React.useMemo(() => ({ children: "Settings" }), [])
  const themesTooltip = React.useMemo(() => ({ children: "Themes" }), [])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show loading state while determining mobile layout (prevents hydration mismatch)
  if (isMobile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show auth page if user is not authenticated and Supabase is configured
  if (!user && typeof window !== 'undefined') {
    // Check if Supabase is properly configured (not in localStorage mode)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const isSupabaseConfigured = supabaseUrl && 
      supabaseKey && 
      !supabaseUrl.includes('your_supabase_project_url_here') &&
      !supabaseKey.includes('your_supabase_anon_key_here')
    
    if (isSupabaseConfigured) {
      return <AuthPage />
    }
  }

  // Mobile layout: Simple container with header + main + bottom nav
  if (isMobile) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md">
          <div className="flex-1">
            <Logo />
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <MiniSyncStatus />
              <UserMenu />
            </div>
          )}
        </header>
        <main className="pb-16">
          <SwipeNavigation>
            {children}
          </SwipeNavigation>
        </main>
        <BottomNav />
      </div>
    )
  }

  // Desktop layout: Sidebar with collapsible behavior
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
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
          {user && (
            <div className="p-2">
              <UserMenu />
            </div>
          )}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <SidebarTrigger />
          <div className="flex-1">
            {/* You can add a page title or breadcrumbs here */}
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <MiniSyncStatus />
              <UserMenu />
            </div>
          )}
        </header>
        <main>
          <SwipeNavigation>
            {children}
          </SwipeNavigation>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
