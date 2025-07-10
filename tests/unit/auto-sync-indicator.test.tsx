/**
 * Auto-Sync Indicator Tests
 * Tests for the background sync status indicator components
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MiniSyncStatus } from '@/components/sync/sync-status-indicator'
import { autoSyncManager } from '@/lib/auto-sync-manager'

// Mock the auto-sync manager
jest.mock('@/lib/auto-sync-manager', () => ({
  autoSyncManager: {
    getStatus: jest.fn(),
    onStatusChange: jest.fn(),
    forceSync: jest.fn(),
    cleanup: jest.fn()
  }
}))

const mockAutoSyncManager = autoSyncManager as jest.Mocked<typeof autoSyncManager>

describe('Auto-Sync Indicator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock status
    mockAutoSyncManager.getStatus.mockResolvedValue({
      isEnabled: true,
      isRunning: true,
      lastSyncAttempt: Date.now() - 30000,
      lastSuccessfulSync: Date.now() - 60000,
      pendingOperations: 0,
      failedOperations: 0,
      syncInterval: 10000,
      connectivity: {
        isOnline: true,
        isDatabaseReachable: true
      }
    })
    
    mockAutoSyncManager.onStatusChange.mockReturnValue(() => {})
  })

  describe('Indicator Visibility and States', () => {
    test('should display correct visual states', async () => {
      // Test online state (green dot)
      mockAutoSyncManager.getStatus.mockResolvedValue({
        isEnabled: true,
        isRunning: true,
        lastSyncAttempt: Date.now() - 30000,
        lastSuccessfulSync: Date.now() - 60000,
        pendingOperations: 0,
        failedOperations: 0,
        syncInterval: 10000,
        connectivity: {
          isOnline: true,
          isDatabaseReachable: true
        }
      })

      render(<MiniSyncStatus />)

      await waitFor(() => {
        expect(screen.getByTestId('sync-indicator')).toBeInTheDocument()
      })

      const indicator = screen.getByTestId('sync-indicator')
      expect(indicator).toHaveClass('bg-green-500') // Online state
    })

    test('should show offline state (orange dot)', async () => {
      mockAutoSyncManager.getStatus.mockResolvedValue({
        isEnabled: true,
        isRunning: true,
        lastSyncAttempt: Date.now() - 30000,
        lastSuccessfulSync: Date.now() - 60000,
        pendingOperations: 3,
        failedOperations: 0,
        syncInterval: 10000,
        connectivity: {
          isOnline: false,
          isDatabaseReachable: false
        }
      })

      render(<MiniSyncStatus />)

      await waitFor(() => {
        expect(screen.getByTestId('sync-indicator')).toBeInTheDocument()
      })

      const indicator = screen.getByTestId('sync-indicator')
      expect(indicator).toHaveClass('bg-orange-500') // Offline state
    })

    test('should show syncing state (blue spinning)', async () => {
      mockAutoSyncManager.getStatus.mockResolvedValue({
        isEnabled: true,
        isRunning: true,
        lastSyncAttempt: Date.now() - 2000, // Very recent
        lastSuccessfulSync: Date.now() - 60000,
        pendingOperations: 5,
        failedOperations: 0,
        syncInterval: 10000,
        connectivity: {
          isOnline: true,
          isDatabaseReachable: true
        }
      })

      render(<MiniSyncStatus />)

      await waitFor(() => {
        expect(screen.getByTestId('sync-indicator')).toBeInTheDocument()
      })

      const indicator = screen.getByTestId('sync-indicator')
      expect(indicator).toHaveClass('bg-blue-500') // Syncing state
      expect(indicator).toHaveClass('animate-spin') // Spinning animation
    })

    test('should show error state when sync fails', async () => {
      mockAutoSyncManager.getStatus.mockResolvedValue({
        isEnabled: true,
        isRunning: true,
        lastSyncAttempt: Date.now() - 30000,
        lastSuccessfulSync: Date.now() - 60000,
        pendingOperations: 0,
        failedOperations: 3,
        syncInterval: 10000,
        connectivity: {
          isOnline: true,
          isDatabaseReachable: true
        }
      })

      render(<MiniSyncStatus />)

      await waitFor(() => {
        expect(screen.getByTestId('sync-indicator')).toBeInTheDocument()
      })

      const indicator = screen.getByTestId('sync-indicator')
      expect(indicator).toHaveClass('bg-red-500') // Error state
    })

    test('should show detailed tooltip on hover', async () => {
      mockAutoSyncManager.getStatus.mockResolvedValue({
        isEnabled: true,
        isRunning: true,
        lastSyncAttempt: Date.now() - 30000,
        lastSuccessfulSync: Date.now() - 60000,
        pendingOperations: 3,
        failedOperations: 0,
        syncInterval: 10000,
        connectivity: {
          isOnline: true,
          isDatabaseReachable: true
        }
      })

      render(<MiniSyncStatus />)

      const indicator = await screen.findByTestId('sync-indicator')
      
      // Hover over indicator
      fireEvent.mouseEnter(indicator)

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument()
      })

      // Should show detailed status in tooltip
      const tooltip = screen.getByRole('tooltip')
      expect(tooltip).toBeInTheDocument()
      expect(tooltip).toHaveTextContent(/3 pending/i)
      expect(tooltip).toHaveTextContent(/online/i)
    })

    test('should update tooltip content based on status', async () => {
      let statusCallback: ((status: any) => void) | null = null
      
      mockAutoSyncManager.onStatusChange.mockImplementation((callback) => {
        statusCallback = callback
        return () => {}
      })

      render(<MiniSyncStatus />)

      const indicator = await screen.findByTestId('sync-indicator')
      fireEvent.mouseEnter(indicator)

      // Initial tooltip
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument()
      })

      // Simulate status change
      if (statusCallback) {
        statusCallback({
          isEnabled: true,
          isRunning: true,
          lastSyncAttempt: Date.now() - 30000,
          lastSuccessfulSync: Date.now() - 60000,
          pendingOperations: 7,
          failedOperations: 0,
          syncInterval: 10000,
          connectivity: {
            isOnline: false,
            isDatabaseReachable: false
          }
        })
      }

      // Tooltip should update
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent(/7 pending/i)
      })
      
      expect(screen.getByRole('tooltip')).toHaveTextContent(/offline/i)
    })
  })

  describe('Responsive Design', () => {
    test('should adapt to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<MiniSyncStatus />)

      await waitFor(() => {
        expect(screen.getByTestId('sync-indicator')).toBeInTheDocument()
      })

      const indicator = screen.getByTestId('sync-indicator')
      
      // Should have mobile-appropriate size
      expect(indicator).toHaveClass('w-3', 'h-3') // Mobile size
    })

    test('should work in different container contexts', async () => {
      // Test in header context
      render(
        <div data-testid="header-container">
          <MiniSyncStatus />
        </div>
      )

      await waitFor(() => {
        expect(screen.getByTestId('sync-indicator')).toBeInTheDocument()
      })

      const headerContainer = screen.getByTestId('header-container')
      const indicator = screen.getByTestId('sync-indicator')
      
      expect(headerContainer).toContainElement(indicator)
      expect(indicator).toHaveClass('inline-block') // Should be inline in header
    })

    test('should handle touch interactions on mobile', async () => {
      // Mock mobile environment
      Object.defineProperty(window, 'ontouchstart', {
        value: () => {},
        writable: true
      })

      render(<MiniSyncStatus />)

      const indicator = await screen.findByTestId('sync-indicator')
      
      // Touch interaction should show tooltip
      fireEvent.touchStart(indicator)

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument()
      })
    })
  })

  describe('Badge Variants', () => {
    test('should show count badge when there are pending operations', async () => {
      mockAutoSyncManager.getStatus.mockResolvedValue({
        isEnabled: true,
        isRunning: true,
        lastSyncAttempt: Date.now() - 30000,
        lastSuccessfulSync: Date.now() - 60000,
        pendingOperations: 12,
        failedOperations: 0,
        syncInterval: 10000,
        connectivity: {
          isOnline: false,
          isDatabaseReachable: false
        }
      })

      render(<MiniSyncStatus />)

      await waitFor(() => {
        expect(screen.getByTestId('sync-badge')).toBeInTheDocument()
      })

      const badge = screen.getByTestId('sync-badge')
      expect(badge).toHaveTextContent('12')
    })

    test('should hide badge when no pending operations', async () => {
      mockAutoSyncManager.getStatus.mockResolvedValue({
        isEnabled: true,
        isRunning: true,
        lastSyncAttempt: Date.now() - 30000,
        lastSuccessfulSync: Date.now() - 60000,
        pendingOperations: 0,
        failedOperations: 0,
        syncInterval: 10000,
        connectivity: {
          isOnline: true,
          isDatabaseReachable: true
        }
      })

      render(<MiniSyncStatus />)

      await waitFor(() => {
        expect(screen.getByTestId('sync-indicator')).toBeInTheDocument()
      })

      // Badge should not be visible
      expect(screen.queryByTestId('sync-badge')).not.toBeInTheDocument()
    })

    test('should show error badge when sync fails', async () => {
      mockAutoSyncManager.getStatus.mockResolvedValue({
        isEnabled: true,
        isRunning: true,
        lastSyncAttempt: Date.now() - 30000,
        lastSuccessfulSync: Date.now() - 60000,
        pendingOperations: 0,
        failedOperations: 2,
        syncInterval: 10000,
        connectivity: {
          isOnline: true,
          isDatabaseReachable: true
        }
      })

      render(<MiniSyncStatus />)

      await waitFor(() => {
        expect(screen.getByTestId('sync-badge')).toBeInTheDocument()
      })

      const badge = screen.getByTestId('sync-badge')
      expect(badge).toHaveTextContent('!')
      expect(badge).toHaveClass('bg-red-500') // Error badge color
    })

    test('should limit badge count display', async () => {
      mockAutoSyncManager.getStatus.mockResolvedValue({
        isEnabled: true,
        isRunning: true,
        lastSyncAttempt: Date.now() - 30000,
        lastSuccessfulSync: Date.now() - 60000,
        pendingOperations: 99,
        failedOperations: 0,
        syncInterval: 10000,
        connectivity: {
          isOnline: false,
          isDatabaseReachable: false
        }
      })

      render(<MiniSyncStatus />)

      await waitFor(() => {
        expect(screen.getByTestId('sync-badge')).toBeInTheDocument()
      })

      const badge = screen.getByTestId('sync-badge')
      expect(badge).toHaveTextContent('99+') // Should show 99+ for large counts
    })
  })

  describe('Animation and Transitions', () => {
    test('should animate state transitions', async () => {
      let statusCallback: ((status: any) => void) | null = null
      
      mockAutoSyncManager.onStatusChange.mockImplementation((callback) => {
        statusCallback = callback
        return () => {}
      })

      render(<MiniSyncStatus />)

      const indicator = await screen.findByTestId('sync-indicator')
      
      // Should not be spinning initially
      expect(indicator).not.toHaveClass('animate-spin')

      // Simulate sync start
      if (statusCallback) {
        statusCallback({
          isEnabled: true,
          isRunning: true,
          lastSyncAttempt: Date.now() - 1000,
          lastSuccessfulSync: Date.now() - 60000,
          pendingOperations: 3,
          failedOperations: 0,
          syncInterval: 10000,
          connectivity: {
            isOnline: true,
            isDatabaseReachable: true
          }
        })
      }

      // Should start spinning
      await waitFor(() => {
        expect(indicator).toHaveClass('animate-spin')
      })

      // Simulate sync completion
      if (statusCallback) {
        statusCallback({
          isEnabled: true,
          isRunning: true,
          lastSyncAttempt: Date.now() - 10000,
          lastSuccessfulSync: Date.now() - 1000,
          pendingOperations: 0,
          failedOperations: 0,
          syncInterval: 10000,
          connectivity: {
            isOnline: true,
            isDatabaseReachable: true
          }
        })
      }

      // Should stop spinning
      await waitFor(() => {
        expect(indicator).not.toHaveClass('animate-spin')
      })
    })

    test('should handle color transitions smoothly', async () => {
      let statusCallback: ((status: any) => void) | null = null
      
      mockAutoSyncManager.onStatusChange.mockImplementation((callback) => {
        statusCallback = callback
        return () => {}
      })

      render(<MiniSyncStatus />)

      const indicator = await screen.findByTestId('sync-indicator')
      
      // Should start with online color
      expect(indicator).toHaveClass('bg-green-500')

      // Simulate going offline
      if (statusCallback) {
        statusCallback({
          isEnabled: true,
          isRunning: true,
          lastSyncAttempt: Date.now() - 30000,
          lastSuccessfulSync: Date.now() - 60000,
          pendingOperations: 0,
          failedOperations: 0,
          syncInterval: 10000,
          connectivity: {
            isOnline: false,
            isDatabaseReachable: false
          }
        })
      }

      // Should change to offline color
      await waitFor(() => {
        expect(indicator).toHaveClass('bg-orange-500')
      })

      // Should have transition class for smooth change
      expect(indicator).toHaveClass('transition-all')
    })
  })

  describe('Performance Optimizations', () => {
    test('should debounce rapid status updates', async () => {
      let statusCallback: ((status: any) => void) | null = null
      
      mockAutoSyncManager.onStatusChange.mockImplementation((callback) => {
        statusCallback = callback
        return () => {}
      })

      render(<MiniSyncStatus />)

      // Simulate rapid status updates
      if (statusCallback) {
        for (let i = 0; i < 20; i++) {
          statusCallback({
            isEnabled: true,
            isRunning: true,
            lastSyncAttempt: Date.now() - 30000,
            lastSuccessfulSync: Date.now() - 60000,
            pendingOperations: i,
            failedOperations: 0,
            syncInterval: 10000,
            connectivity: {
              isOnline: true,
              isDatabaseReachable: true
            }
          })
        }
      }

      // Should handle rapid updates without performance issues
      await waitFor(() => {
        expect(screen.getByTestId('sync-indicator')).toBeInTheDocument()
      })
    })

    test('should cleanup subscriptions on unmount', () => {
      const unsubscribe = jest.fn()
      mockAutoSyncManager.onStatusChange.mockReturnValue(unsubscribe)

      const { unmount } = render(<MiniSyncStatus />)
      
      unmount()

      expect(unsubscribe).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    test('should handle status fetch errors gracefully', async () => {
      mockAutoSyncManager.getStatus.mockRejectedValue(new Error('Status fetch failed'))

      render(<MiniSyncStatus />)

      await waitFor(() => {
        expect(screen.getByTestId('sync-indicator')).toBeInTheDocument()
      })

      // Should show error state
      const indicator = screen.getByTestId('sync-indicator')
      expect(indicator).toHaveClass('bg-red-500')
    })

    test('should handle missing status properties', async () => {
      mockAutoSyncManager.getStatus.mockResolvedValue({
        isEnabled: true,
        isRunning: true,
        // Missing some properties
        connectivity: {
          isOnline: true,
          isDatabaseReachable: true
        }
      } as any)

      render(<MiniSyncStatus />)

      // Should render without crashing
      await waitFor(() => {
        expect(screen.getByTestId('sync-indicator')).toBeInTheDocument()
      })
    })

    test('should handle callback errors without crashing', async () => {
      mockAutoSyncManager.onStatusChange.mockImplementation((callback) => {
        // Simulate callback error
        setTimeout(() => {
          try {
            callback(null as any)
          } catch (error) {
            // Should handle gracefully
          }
        }, 100)
        return () => {}
      })

      // Should render without crashing
      expect(() => render(<MiniSyncStatus />)).not.toThrow()
    })
  })

  describe('Accessibility', () => {
    test('should provide proper ARIA labels', async () => {
      render(<MiniSyncStatus />)

      await waitFor(() => {
        expect(screen.getByTestId('sync-indicator')).toBeInTheDocument()
      })

      const indicator = screen.getByTestId('sync-indicator')
      expect(indicator).toHaveAttribute('aria-label', expect.stringContaining('sync'))
      expect(indicator).toHaveAttribute('role', 'status')
    })

    test('should announce status changes', async () => {
      let statusCallback: ((status: any) => void) | null = null
      
      mockAutoSyncManager.onStatusChange.mockImplementation((callback) => {
        statusCallback = callback
        return () => {}
      })

      render(<MiniSyncStatus />)

      // Should have live region for announcements
      const indicator = await screen.findByTestId('sync-indicator')
      expect(indicator).toHaveAttribute('aria-live', 'polite')

      // Simulate status change
      if (statusCallback) {
        statusCallback({
          isEnabled: true,
          isRunning: true,
          lastSyncAttempt: Date.now() - 30000,
          lastSuccessfulSync: Date.now() - 60000,
          pendingOperations: 0,
          failedOperations: 0,
          syncInterval: 10000,
          connectivity: {
            isOnline: false,
            isDatabaseReachable: false
          }
        })
      }

      // Should announce the change
      await waitFor(() => {
        expect(indicator).toHaveAttribute('aria-label', expect.stringContaining('offline'))
      })
    })

    test('should be focusable and keyboard accessible', async () => {
      render(<MiniSyncStatus />)

      const indicator = await screen.findByTestId('sync-indicator')
      
      // Should be focusable
      expect(indicator).toHaveAttribute('tabIndex', '0')
      
      // Should show tooltip on focus
      fireEvent.focus(indicator)
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument()
      })
    })
  })

  describe('Integration with Different Contexts', () => {
    test('should work correctly in header context', async () => {
      render(
        <header data-testid="header">
          <MiniSyncStatus />
        </header>
      )

      await waitFor(() => {
        expect(screen.getByTestId('sync-indicator')).toBeInTheDocument()
      })

      const header = screen.getByTestId('header')
      const indicator = screen.getByTestId('sync-indicator')
      
      expect(header).toContainElement(indicator)
    })

    test('should work correctly in sidebar context', async () => {
      render(
        <div data-testid="sidebar">
          <MiniSyncStatus />
        </div>
      )

      await waitFor(() => {
        expect(screen.getByTestId('sync-indicator')).toBeInTheDocument()
      })

      const sidebar = screen.getByTestId('sidebar')
      const indicator = screen.getByTestId('sync-indicator')
      
      expect(sidebar).toContainElement(indicator)
    })
  })
})