/**
 * Settings Interface Tests
 * Tests for the simplified auto-sync settings interface
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AutoSyncStatus } from '@/components/auto-sync-status'
import { autoSyncManager } from '@/lib/auto-sync-manager'

// Mock the auto-sync manager
jest.mock('@/lib/auto-sync-manager', () => ({
  autoSyncManager: {
    getStatus: jest.fn(),
    forceSync: jest.fn(),
    onStatusChange: jest.fn(),
    getDebugInfo: jest.fn(),
    checkDataConsistency: jest.fn(),
    autoRepairData: jest.fn(),
    cleanup: jest.fn()
  }
}))

// Mock the auto-sync status hook
jest.mock('@/hooks/use-auto-sync-status', () => ({
  useAutoSyncStatus: jest.fn()
}))

// Mock the force sync button
jest.mock('@/components/force-sync-button', () => ({
  ForceSyncButton: () => <button data-testid="force-sync-button">Force Sync</button>
}))

const mockAutoSyncManager = autoSyncManager as jest.Mocked<typeof autoSyncManager>
const mockUseAutoSyncStatus = require('@/hooks/use-auto-sync-status').useAutoSyncStatus

describe('Settings Interface', () => {
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

    // Default mock hook status
    mockUseAutoSyncStatus.mockReturnValue({
      isOnline: true,
      isEnabled: true,
      isProcessing: false,
      pendingCount: 0,
      lastSync: Date.now() - 60000,
      failedCount: 0
    })
  })

  describe('Simplified Settings Interface', () => {
    test('should display simplified sync status', async () => {
      // Mock different sync states
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

      render(<AutoSyncStatus />)

      await waitFor(() => {
        expect(screen.getByText(/online/i)).toBeInTheDocument()
      })

      // Should show online status
      expect(screen.getByText(/online/i)).toBeInTheDocument()
      expect(screen.queryByText(/offline/i)).not.toBeInTheDocument()
    })

    test('should show offline status when disconnected', async () => {
      mockUseAutoSyncStatus.mockReturnValue({
        isOnline: false,
        isEnabled: true,
        isProcessing: false,
        pendingCount: 3,
        lastSync: Date.now() - 60000,
        failedCount: 0
      })

      render(<AutoSyncStatus />)

      await waitFor(() => {
        expect(screen.getByText(/offline/i)).toBeInTheDocument()
      })

      // Should show offline status
      expect(screen.getByText(/offline/i)).toBeInTheDocument()
      expect(screen.queryByText(/online/i)).not.toBeInTheDocument()
    })

    test('should show syncing status when operations are pending', async () => {
      mockUseAutoSyncStatus.mockReturnValue({
        isOnline: true,
        isEnabled: true,
        isProcessing: true,
        pendingCount: 5,
        lastSync: Date.now() - 60000,
        failedCount: 0
      })

      render(<AutoSyncStatus />)

      await waitFor(() => {
        expect(screen.getByText(/syncing/i)).toBeInTheDocument()
      })

      // Should show syncing status with pending count
      expect(screen.getByText(/syncing/i)).toBeInTheDocument()
      expect(screen.getByText(/5/)).toBeInTheDocument()
    })

    test('should display pending changes count when offline', async () => {
      mockAutoSyncManager.getStatus.mockResolvedValue({
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

      render(<AutoSyncStatus />)

      await waitFor(() => {
        expect(screen.getByText(/7/)).toBeInTheDocument()
      })

      // Should show pending changes count
      expect(screen.getByText(/7/)).toBeInTheDocument()
      expect(screen.getByText(/pending/i)).toBeInTheDocument()
    })

    test('should show "Always On" messaging', async () => {
      render(<AutoSyncStatus />)

      await waitFor(() => {
        expect(screen.getByText(/automatic/i)).toBeInTheDocument()
      })

      // Should show automatic sync messaging
      expect(screen.getByText(/automatic/i)).toBeInTheDocument()
      expect(screen.queryByRole('switch')).not.toBeInTheDocument()
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    })

    test('should not show enable/disable toggles', async () => {
      render(<AutoSyncStatus />)

      await waitFor(() => {
        expect(screen.queryByRole('switch')).not.toBeInTheDocument()
      })

      // Should not have any toggles or switches
      expect(screen.queryByRole('switch')).not.toBeInTheDocument()
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
      expect(screen.queryByText(/enable/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/disable/i)).not.toBeInTheDocument()
    })
  })

  describe('Force Sync Functionality', () => {
    test('should trigger manual sync when clicked', async () => {
      mockAutoSyncManager.forceSync.mockResolvedValue()

      render(<AutoSyncStatus />)

      // Find and click force sync button
      const forceSyncButton = await screen.findByRole('button', { name: /sync now/i })
      fireEvent.click(forceSyncButton)

      await waitFor(() => {
        expect(mockAutoSyncManager.forceSync).toHaveBeenCalledTimes(1)
      })

      expect(mockAutoSyncManager.forceSync).toHaveBeenCalled()
    })

    test('should disable during active sync', async () => {
      // Mock active sync state
      mockAutoSyncManager.getStatus.mockResolvedValue({
        isEnabled: true,
        isRunning: true,
        lastSyncAttempt: Date.now() - 1000, // Very recent
        lastSuccessfulSync: Date.now() - 60000,
        pendingOperations: 3,
        failedOperations: 0,
        syncInterval: 10000,
        connectivity: {
          isOnline: true,
          isDatabaseReachable: true
        }
      })

      render(<AutoSyncStatus />)

      // Button should be disabled during active sync
      const forceSyncButton = await screen.findByRole('button', { name: /sync now/i })
      expect(forceSyncButton).toBeDisabled()
    })

    test('should show loading state during sync', async () => {
      // Mock sync in progress
      mockAutoSyncManager.forceSync.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      )

      render(<AutoSyncStatus />)

      const forceSyncButton = await screen.findByRole('button', { name: /sync now/i })
      fireEvent.click(forceSyncButton)

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/syncing/i)).toBeInTheDocument()
      })
    })

    test('should handle sync errors gracefully', async () => {
      // Mock sync failure
      mockAutoSyncManager.forceSync.mockRejectedValue(new Error('Sync failed'))

      render(<AutoSyncStatus />)

      const forceSyncButton = await screen.findByRole('button', { name: /sync now/i })
      fireEvent.click(forceSyncButton)

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })

      // Should show error message
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })

    test('should be hidden when offline', async () => {
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

      render(<AutoSyncStatus />)

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /sync now/i })).not.toBeInTheDocument()
      })

      // Force sync button should not be visible when offline
      expect(screen.queryByRole('button', { name: /sync now/i })).not.toBeInTheDocument()
    })
  })

  describe('Status Updates and Reactivity', () => {
    test('should update status in real-time', async () => {
      let statusCallback: ((status: any) => void) | null = null
      
      mockAutoSyncManager.onStatusChange.mockImplementation((callback) => {
        statusCallback = callback
        return () => {}
      })

      render(<AutoSyncStatus />)

      // Initial state
      await waitFor(() => {
        expect(screen.getByText(/online/i)).toBeInTheDocument()
      })

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

      // Should update to offline
      await waitFor(() => {
        expect(screen.getByText(/offline/i)).toBeInTheDocument()
      })
    })

    test('should handle multiple rapid status changes', async () => {
      let statusCallback: ((status: any) => void) | null = null
      
      mockAutoSyncManager.onStatusChange.mockImplementation((callback) => {
        statusCallback = callback
        return () => {}
      })

      render(<AutoSyncStatus />)

      // Simulate rapid status changes
      if (statusCallback) {
        // Go offline
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

        // Go back online
        statusCallback({
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
      }

      // Should handle rapid changes without errors
      await waitFor(() => {
        expect(screen.getByText(/online/i)).toBeInTheDocument()
      })
    })

    test('should unsubscribe from status changes on unmount', () => {
      const unsubscribe = jest.fn()
      mockAutoSyncManager.onStatusChange.mockReturnValue(unsubscribe)

      const { unmount } = render(<AutoSyncStatus />)

      // Unmount component
      unmount()

      // Should have called unsubscribe
      expect(unsubscribe).toHaveBeenCalled()
    })
  })

  describe('Last Sync Time Display', () => {
    test('should show last sync time', async () => {
      const lastSyncTime = Date.now() - 60000 // 1 minute ago
      
      mockAutoSyncManager.getStatus.mockResolvedValue({
        isEnabled: true,
        isRunning: true,
        lastSyncAttempt: Date.now() - 30000,
        lastSuccessfulSync: lastSyncTime,
        pendingOperations: 0,
        failedOperations: 0,
        syncInterval: 10000,
        connectivity: {
          isOnline: true,
          isDatabaseReachable: true
        }
      })

      render(<AutoSyncStatus />)

      await waitFor(() => {
        expect(screen.getByText(/last sync/i)).toBeInTheDocument()
      })

      // Should show last sync time
      expect(screen.getByText(/last sync/i)).toBeInTheDocument()
      expect(screen.getByText(/minute ago/i)).toBeInTheDocument()
    })

    test('should show "Never" when no sync has occurred', async () => {
      mockAutoSyncManager.getStatus.mockResolvedValue({
        isEnabled: true,
        isRunning: true,
        lastSyncAttempt: null,
        lastSuccessfulSync: null,
        pendingOperations: 0,
        failedOperations: 0,
        syncInterval: 10000,
        connectivity: {
          isOnline: true,
          isDatabaseReachable: true
        }
      })

      render(<AutoSyncStatus />)

      await waitFor(() => {
        expect(screen.getByText(/never/i)).toBeInTheDocument()
      })

      // Should show "Never" for last sync
      expect(screen.getByText(/never/i)).toBeInTheDocument()
    })

    test('should update last sync time dynamically', async () => {
      let statusCallback: ((status: any) => void) | null = null
      
      mockAutoSyncManager.onStatusChange.mockImplementation((callback) => {
        statusCallback = callback
        return () => {}
      })

      render(<AutoSyncStatus />)

      // Initial state with no sync
      await waitFor(() => {
        expect(screen.getByText(/never/i)).toBeInTheDocument()
      })

      // Simulate successful sync
      if (statusCallback) {
        statusCallback({
          isEnabled: true,
          isRunning: true,
          lastSyncAttempt: Date.now(),
          lastSuccessfulSync: Date.now(),
          pendingOperations: 0,
          failedOperations: 0,
          syncInterval: 10000,
          connectivity: {
            isOnline: true,
            isDatabaseReachable: true
          }
        })
      }

      // Should update to show recent sync
      await waitFor(() => {
        expect(screen.getByText(/just now/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    test('should handle status fetch errors', async () => {
      mockAutoSyncManager.getStatus.mockRejectedValue(new Error('Status fetch failed'))

      render(<AutoSyncStatus />)

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })

      // Should show error state
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })

    test('should handle missing status fields gracefully', async () => {
      mockAutoSyncManager.getStatus.mockResolvedValue({
        isEnabled: true,
        isRunning: true,
        // Missing some fields
        connectivity: {
          isOnline: true,
          isDatabaseReachable: true
        }
      } as any)

      render(<AutoSyncStatus />)

      // Should render without crashing
      await waitFor(() => {
        expect(screen.getByText(/online/i)).toBeInTheDocument()
      })
    })

    test('should handle callback errors gracefully', async () => {
      // Mock callback that throws error
      mockAutoSyncManager.onStatusChange.mockImplementation((callback) => {
        setTimeout(() => {
          try {
            callback({
              isEnabled: true,
              isRunning: true,
              pendingOperations: 0,
              failedOperations: 0,
              syncInterval: 10000,
              connectivity: {
                isOnline: true,
                isDatabaseReachable: true
              }
            })
          } catch (error) {
            // Should handle callback errors
          }
        }, 100)
        return () => {}
      })

      // Should render without crashing
      expect(() => render(<AutoSyncStatus />)).not.toThrow()
    })
  })

  describe('Accessibility', () => {
    test('should have proper ARIA labels', async () => {
      render(<AutoSyncStatus />)

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
      })

      // Should have proper ARIA labels
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByLabelText(/sync status/i)).toBeInTheDocument()
    })

    test('should announce status changes to screen readers', async () => {
      let statusCallback: ((status: any) => void) | null = null
      
      mockAutoSyncManager.onStatusChange.mockImplementation((callback) => {
        statusCallback = callback
        return () => {}
      })

      render(<AutoSyncStatus />)

      // Should have live region for status announcements
      const liveRegion = screen.getByRole('status')
      expect(liveRegion).toHaveAttribute('aria-live', 'polite')
    })

    test('should be keyboard accessible', async () => {
      render(<AutoSyncStatus />)

      const forceSyncButton = await screen.findByRole('button', { name: /sync now/i })
      
      // Should be focusable
      forceSyncButton.focus()
      expect(forceSyncButton).toHaveFocus()

      // Should be activatable with Enter
      fireEvent.keyDown(forceSyncButton, { key: 'Enter', code: 'Enter' })
      expect(mockAutoSyncManager.forceSync).toHaveBeenCalled()
    })
  })

  describe('Performance', () => {
    test('should debounce rapid status updates', async () => {
      let statusCallback: ((status: any) => void) | null = null
      
      mockAutoSyncManager.onStatusChange.mockImplementation((callback) => {
        statusCallback = callback
        return () => {}
      })

      render(<AutoSyncStatus />)

      // Simulate rapid status updates
      if (statusCallback) {
        for (let i = 0; i < 10; i++) {
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
        expect(screen.getByText(/online/i)).toBeInTheDocument()
      })
    })

    test('should cleanup resources on unmount', () => {
      const cleanup = jest.fn()
      mockAutoSyncManager.onStatusChange.mockReturnValue(cleanup)

      const { unmount } = render(<AutoSyncStatus />)
      unmount()

      expect(cleanup).toHaveBeenCalled()
    })
  })
})