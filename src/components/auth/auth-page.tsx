"use client"

import { useState } from 'react'
import { AuthForm } from './auth-form'

export function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Expense Tracker</h1>
          <p className="text-muted-foreground mt-2">
            Track your expenses with AI-powered categorization
          </p>
        </div>
        <AuthForm mode={mode} onModeChange={setMode} />
      </div>
    </div>
  )
}