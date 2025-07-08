"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createAuthClient } from '@/lib/supabase'
import type { AuthContextType, User } from '@/lib/types'
import type { Session, AuthError } from '@supabase/supabase-js'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canFallbackToLocalStorage, setCanFallbackToLocalStorage] = useState(false)

  const supabase = createAuthClient()

  // Convert Supabase user to our User type
  const convertUser = (supabaseUser: any): User => ({
    id: supabaseUser.id,
    email: supabaseUser.email,
    name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name,
    avatar_url: supabaseUser.user_metadata?.avatar_url,
    created_at: supabaseUser.created_at,
    updated_at: supabaseUser.updated_at
  })

  useEffect(() => {
    if (!supabase) {
      // Running in localStorage mode - no authentication
      setLoading(false)
      return
    }

    let mounted = true

    // Get initial session with error handling
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.warn('Session recovery error:', error.message)
          // Try to refresh the session
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
          if (!refreshError && refreshedSession && mounted) {
            setUser(convertUser(refreshedSession.user))
          } else if (mounted) {
            setUser(null)
          }
        } else if (mounted) {
          setUser(session?.user ? convertUser(session.user) : null)
        }
      } catch (err) {
        console.warn('Failed to get initial session:', err)
        if (mounted) {
          setUser(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user ? convertUser(session.user) : null)
      } else if (event === 'SIGNED_IN') {
        setUser(session?.user ? convertUser(session.user) : null)
      }
      // Note: SESSION_EXPIRED is not a valid AuthChangeEvent type in Supabase
      // Token refresh is handled automatically by the Supabase client
      
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Authentication not available in localStorage mode')
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    if (!supabase) {
      throw new Error('Authentication not available in localStorage mode')
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            full_name: name,
          },
        },
      })

      if (error) throw error
    } catch (err) {
      let message = err instanceof Error ? err.message : 'Failed to sign up'
      let shouldOfferLocalStorage = false
      
      // Enhance error messages for common database issues
      if (message.includes('trigger') || message.includes('function') || message.includes('database')) {
        message = 'Database setup incomplete. You can continue using the app in offline mode, or contact support to fix the database configuration.'
        shouldOfferLocalStorage = true
      } else if (message.includes('connection') || message.includes('timeout')) {
        message = 'Unable to connect to database. You can continue using the app in offline mode, or check your internet connection and try again.'
        shouldOfferLocalStorage = true
      } else if (message.includes('already registered') || message.includes('email')) {
        message = 'This email is already registered. Please try signing in instead.'
      }
      
      setError(message)
      setCanFallbackToLocalStorage(shouldOfferLocalStorage)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    if (!supabase) {
      throw new Error('Authentication not available in localStorage mode')
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign out'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
    setCanFallbackToLocalStorage(false)
  }

  const switchToLocalStorage = () => {
    // Force reload to localStorage mode by clearing all auth state
    setUser(null)
    setLoading(false)
    setError(null)
    setCanFallbackToLocalStorage(false)
    
    // Clear any stored session data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('.supabase.co', '') + '-auth-token')
    }
    
    // Reload the page to reinitialize in localStorage mode
    window.location.reload()
  }

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    clearError,
    canFallbackToLocalStorage,
    switchToLocalStorage,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}