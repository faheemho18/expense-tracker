"use client"

import { useEffect } from 'react'
import { dataService } from '@/lib/supabase-data-service'

/**
 * Hook that initializes the data service for shared usage (no authentication)
 * This ensures the data service works without user authentication
 */
export function useAuthDataService() {
  useEffect(() => {
    // Set to null for shared usage (no user isolation)
    dataService.setUserId(null)
  }, [])

  return {
    userId: null,
    isAuthenticated: false,
  }
}