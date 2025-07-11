"use client"

import * as React from "react"

export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(false)

  const signOut = React.useCallback(async () => {
    setLoading(true)
    try {
      // For this shared usage app, we don't actually need authentication
      // This is just a placeholder to satisfy the component requirements
      setUser(null)
    } catch (error) {
      console.error("Sign out error:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const value = React.useMemo(
    () => ({
      user,
      loading,
      signOut,
    }),
    [user, loading, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}