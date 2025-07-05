import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../auth-context'
import { createAuthClient } from '@/lib/supabase'
import type { User } from '@/lib/types'

// Mock the Supabase client
jest.mock('@/lib/supabase')

// Test component to access auth context
const TestComponent = () => {
  const auth = useAuth()
  return (
    <div>
      <div data-testid="loading">{auth.loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{auth.user ? auth.user.email : 'no-user'}</div>
      <div data-testid="error">{auth.error || 'no-error'}</div>
      <button data-testid="sign-in" onClick={() => auth.signIn('test@example.com', 'password')}>
        Sign In
      </button>
      <button data-testid="sign-up" onClick={() => auth.signUp('test@example.com', 'password', 'Test User')}>
        Sign Up
      </button>
      <button data-testid="sign-out" onClick={() => auth.signOut()}>
        Sign Out
      </button>
      <button data-testid="clear-error" onClick={() => auth.clearError()}>
        Clear Error
      </button>
    </div>
  )
}

const renderWithAuth = () => {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  )
}

describe('AuthProvider', () => {
  const mockSupabaseClient = {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createAuthClient as jest.Mock).mockReturnValue(mockSupabaseClient)
    
    // Default mock implementations
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })
    
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: {} },
      unsubscribe: jest.fn()
    })
  })

  describe('localStorage mode (no Supabase)', () => {
    beforeEach(() => {
      ;(createAuthClient as jest.Mock).mockReturnValue(null)
    })

    it('should initialize in localStorage mode when Supabase is not available', async () => {
      renderWithAuth()
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })
      
      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
      expect(screen.getByTestId('error')).toHaveTextContent('no-error')
    })

    it('should show "Supabase not configured" error when trying to authenticate', async () => {
      renderWithAuth()
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      act(() => {
        screen.getByTestId('sign-in').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Supabase not configured')
      })
    })
  })

  describe('Supabase mode', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: {
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg'
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    const mockSession = {
      user: mockUser,
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token'
    }

    it('should initialize with existing session', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
      expect(screen.getByTestId('error')).toHaveTextContent('no-error')
    })

    it('should handle sign in successfully', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      act(() => {
        screen.getByTestId('sign-in').click()
      })

      await waitFor(() => {
        expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password'
        })
      })
    })

    it('should handle sign in error', async () => {
      const authError = { message: 'Invalid credentials' }
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: authError
      })

      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      act(() => {
        screen.getByTestId('sign-in').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials')
      })
    })

    it('should handle sign up successfully', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      act(() => {
        screen.getByTestId('sign-up').click()
      })

      await waitFor(() => {
        expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password',
          options: {
            data: {
              name: 'Test User'
            }
          }
        })
      })
    })

    it('should handle sign out successfully', async () => {
      // Start with a signed-in user
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null
      })

      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
      })

      act(() => {
        screen.getByTestId('sign-out').click()
      })

      await waitFor(() => {
        expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
      })
    })

    it('should clear errors', async () => {
      // First cause an error
      const authError = { message: 'Network error' }
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: authError
      })

      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      act(() => {
        screen.getByTestId('sign-in').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Network error')
      })

      // Clear the error
      act(() => {
        screen.getByTestId('clear-error').click()
      })

      expect(screen.getByTestId('error')).toHaveTextContent('no-error')
    })

    it('should handle auth state changes', async () => {
      let authStateCallback: ((event: string, session: any) => void) | null = null

      mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return {
          data: { subscription: {} },
          unsubscribe: jest.fn()
        }
      })

      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      // Simulate auth state change to signed in
      act(() => {
        if (authStateCallback) {
          authStateCallback('SIGNED_IN', mockSession)
        }
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
      })

      // Simulate auth state change to signed out
      act(() => {
        if (authStateCallback) {
          authStateCallback('SIGNED_OUT', null)
        }
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no-user')
      })
    })
  })

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        render(<TestComponent />)
      }).toThrow('useAuth must be used within an AuthProvider')
      
      consoleSpy.mockRestore()
    })
  })

  describe('User type conversion', () => {
    it('should convert Supabase user correctly', async () => {
      const supabaseUser = {
        id: 'user-456',
        email: 'converted@example.com',
        user_metadata: {
          name: 'Converted User',
          full_name: 'Full Name User',
          avatar_url: 'https://example.com/converted.jpg'
        },
        created_at: '2024-02-01T00:00:00Z',
        updated_at: '2024-02-01T00:00:00Z'
      }

      const session = { user: supabaseUser }

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session },
        error: null
      })

      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('converted@example.com')
      })
    })

    it('should handle user without metadata', async () => {
      const supabaseUser = {
        id: 'user-789',
        email: 'minimal@example.com',
        user_metadata: {},
        created_at: '2024-03-01T00:00:00Z',
        updated_at: '2024-03-01T00:00:00Z'
      }

      const session = { user: supabaseUser }

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session },
        error: null
      })

      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('minimal@example.com')
      })
    })
  })
})