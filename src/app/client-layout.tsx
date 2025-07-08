'use client'

import { useEffect } from "react"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Temporarily disable migration to avoid Supabase dependency issues
    const hasMigrated = localStorage.getItem('hasMigratedToSupabase')
    if (!hasMigrated) {
      // Skip migration for demo
      localStorage.setItem('hasMigratedToSupabase', 'true')
    }
  }, [])

  return (
    <>
      {children}
    </>
  )
}