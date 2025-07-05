"use client"

import { useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { dataService } from '@/lib/supabase-data-service'

/**
 * Hook that connects authentication state with the data service
 * This ensures that the data service is always aware of the current user
 */
export function useAuthDataService() {
  const { user } = useAuth()

  useEffect(() => {
    // Update data service with current user ID
    dataService.setUserId(user?.id || null)
  }, [user?.id])

  return {
    userId: user?.id || null,
    isAuthenticated: !!user,
  }
}