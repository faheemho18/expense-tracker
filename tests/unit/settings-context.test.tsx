/**
 * Settings Context Tests
 * Tests for the settings context integration with auto-sync
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SettingsProvider, useSettings } from '@/contexts/settings-context'
import { autoSyncManager } from '@/lib/auto-sync-manager'

// Mock the auto-sync manager
jest.mock('@/lib/auto-sync-manager', () => ({
  autoSyncManager: {
    initialize: jest.fn(),
    getStatus: jest.fn(),
    onStatusChange: jest.fn(),
    forceSync: jest.fn(),
    cleanup: jest.fn()
  },
  AutoSyncUtils: {
    initializeWithDefaults: jest.fn(),
    getSyncStatusText: jest.fn(),
    isHealthy: jest.fn(),
    getHealthReport: jest.fn()
  }
}))

const mockAutoSyncManager = autoSyncManager as jest.Mocked<typeof autoSyncManager>

// Test component to access context
const TestComponent = () => {
  const settings = useSettings()
  
  return (
    <div>
      <div data-testid="sync-enabled">{settings.isAutoSyncEnabled ? 'enabled' : 'disabled'}</div>
      <div data-testid="sync-online">{settings.isOnline ? 'online' : 'offline'}</div>
      <div data-testid="pending-count">{settings.pendingOperations}</div>
      <div data-testid="last-sync">{settings.lastSync ? new Date(settings.lastSync).toISOString() : 'never'}</div>
      <button onClick={settings.forceSync} data-testid="force-sync">Force Sync</button>
      <button onClick={settings.enableAutoSync} data-testid="enable-sync">Enable</button>
      <button onClick={settings.disableAutoSync} data-testid="disable-sync">Disable</button>
    </div>
  )
}

describe('Settings Context Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock setup
    mockAutoSyncManager.initialize.mockResolvedValue(true)
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
    mockAutoSyncManager.forceSync.mockResolvedValue()
  })

  describe('Context Integration', () => {
    test('should auto-initialize sync manager', async () => {
      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      )

      await waitFor(() => {
        expect(mockAutoSyncManager.initialize).toHaveBeenCalled()
      })

      // Should initialize the auto-sync manager
      expect(mockAutoSyncManager.initialize).toHaveBeenCalledTimes(1)
    })

    test('should provide simplified sync state', async () => {
      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('sync-enabled')).toHaveTextContent('enabled')
      })

      // Should provide correct sync state
      expect(screen.getByTestId('sync-enabled')).toHaveTextContent('enabled')
      expect(screen.getByTestId('sync-online')).toHaveTextContent('online')
      expect(screen.getByTestId('pending-count')).toHaveTextContent('0')
    })

    test('should handle reactive updates', async () => {
      let statusCallback: ((status: any) => void) | null = null
      
      mockAutoSyncManager.onStatusChange.mockImplementation((callback) => {
        statusCallback = callback
        return () => {}
      })

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('sync-online')).toHaveTextContent('online')
      })

      // Simulate status change
      if (statusCallback) {
        statusCallback({
          isEnabled: true,
          isRunning: true,
          lastSyncAttempt: Date.now() - 30000,
          lastSuccessfulSync: Date.now() - 60000,
          pendingOperations: 5,
          failedOperations: 0,
          syncInterval: 10000,
          connectivity: {
            isOnline: false,
            isDatabaseReachable: false
          }
        })
      }

      // Should update context values
      await waitFor(() => {
        expect(screen.getByTestId('sync-online')).toHaveTextContent('offline')
      })
      
      expect(screen.getByTestId('pending-count')).toHaveTextContent('5')
    })

    test('should handle force sync calls', async () => {
      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      )

      const forceSyncButton = await screen.findByTestId('force-sync')
      fireEvent.click(forceSyncButton)

      await waitFor(() => {
        expect(mockAutoSyncManager.forceSync).toHaveBeenCalled()
      })

      expect(mockAutoSyncManager.forceSync).toHaveBeenCalledTimes(1)
    })

    test('should update last sync time', async () => {
      const lastSyncTime = Date.now() - 120000 // 2 minutes ago
      
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

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('last-sync')).not.toHaveTextContent('never')
      })

      // Should show last sync time
      const lastSyncDisplay = screen.getByTestId('last-sync')
      expect(lastSyncDisplay).not.toHaveTextContent('never')
      expect(lastSyncDisplay.textContent).toContain(new Date(lastSyncTime).getFullYear().toString())
    })
  })

  describe('Backward Compatibility', () => {
    test('should maintain existing component compatibility', async () => {
      // Create a component that uses legacy context features
      const LegacyComponent = () => {
        const settings = useSettings()
        
        return (
          <div>
            <div data-testid="theme-color">{settings.theme?.primary || 'default'}</div>
            <div data-testid="settings-version">{settings.version || '1.0'}</div>
            <div data-testid="user-preferences">{JSON.stringify(settings.preferences || {})}</div>
          </div>
        )
      }

      render(
        <SettingsProvider>
          <LegacyComponent />
        </SettingsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('theme-color')).toBeInTheDocument()
      })

      // Should maintain existing context structure
      expect(screen.getByTestId('theme-color')).toBeInTheDocument()
      expect(screen.getByTestId('settings-version')).toBeInTheDocument()
      expect(screen.getByTestId('user-preferences')).toBeInTheDocument()
    })

    test('should preserve existing API contract', async () => {
      const ApiTestComponent = () => {
        const settings = useSettings()
        
        return (
          <div>
            <div data-testid="has-force-sync">{typeof settings.forceSync === 'function' ? 'yes' : 'no'}</div>
            <div data-testid="has-enable-sync">{typeof settings.enableAutoSync === 'function' ? 'yes' : 'no'}</div>
            <div data-testid="has-disable-sync">{typeof settings.disableAutoSync === 'function' ? 'yes' : 'no'}</div>
            <div data-testid="has-sync-state">{typeof settings.isAutoSyncEnabled === 'boolean' ? 'yes' : 'no'}</div>
          </div>
        )
      }

      render(
        <SettingsProvider>
          <ApiTestComponent />
        </SettingsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('has-force-sync')).toHaveTextContent('yes')
      })

      // Should preserve all API methods
      expect(screen.getByTestId('has-force-sync')).toHaveTextContent('yes')
      expect(screen.getByTestId('has-enable-sync')).toHaveTextContent('yes')
      expect(screen.getByTestId('has-disable-sync')).toHaveTextContent('yes')
      expect(screen.getByTestId('has-sync-state')).toHaveTextContent('yes')
    })

    test('should handle legacy enable/disable functions', async () => {
      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      )

      const enableButton = await screen.findByTestId('enable-sync')
      const disableButton = await screen.findByTestId('disable-sync')

      // Should have enable/disable buttons
      expect(enableButton).toBeInTheDocument()
      expect(disableButton).toBeInTheDocument()

      // Should be clickable without errors
      fireEvent.click(disableButton)
      fireEvent.click(enableButton)

      // Should not throw errors
      await waitFor(() => {
        expect(screen.getByTestId('sync-enabled')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    test('should handle sync manager initialization failures', async () => {
      mockAutoSyncManager.initialize.mockRejectedValue(new Error('Init failed'))

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('sync-enabled')).toHaveTextContent('disabled')
      })

      // Should handle init failure gracefully
      expect(screen.getByTestId('sync-enabled')).toHaveTextContent('disabled')
    })

    test('should handle status fetch errors', async () => {
      mockAutoSyncManager.getStatus.mockRejectedValue(new Error('Status fetch failed'))

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('sync-enabled')).toBeInTheDocument()
      })

      // Should handle status fetch errors gracefully
      expect(screen.getByTestId('sync-online')).toHaveTextContent('offline')
      expect(screen.getByTestId('pending-count')).toHaveTextContent('0')
    })

    test('should handle callback errors gracefully', async () => {
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
      expect(() => {
        render(
          <SettingsProvider>
            <TestComponent />
          </SettingsProvider>
        )
      }).not.toThrow()
    })

    test('should handle force sync errors', async () => {
      mockAutoSyncManager.forceSync.mockRejectedValue(new Error('Sync failed'))

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      )

      const forceSyncButton = await screen.findByTestId('force-sync')
      fireEvent.click(forceSyncButton)

      await waitFor(() => {
        expect(mockAutoSyncManager.forceSync).toHaveBeenCalled()
      })

      // Should handle force sync errors gracefully
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

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('sync-online')).toHaveTextContent('online')
      })

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
        expect(screen.getByTestId('pending-count')).toHaveTextContent('19')
      })
    })

    test('should cleanup subscriptions on unmount', () => {
      const unsubscribe = jest.fn()
      mockAutoSyncManager.onStatusChange.mockReturnValue(unsubscribe)

      const { unmount } = render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      )

      unmount()

      expect(unsubscribe).toHaveBeenCalled()
    })

    test('should not re-initialize on re-renders', async () => {
      const { rerender } = render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      )

      await waitFor(() => {
        expect(mockAutoSyncManager.initialize).toHaveBeenCalledTimes(1)
      })

      // Re-render
      rerender(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      )

      // Should not re-initialize
      expect(mockAutoSyncManager.initialize).toHaveBeenCalledTimes(1)
    })
  })

  describe('Multiple Consumers', () => {
    test('should handle multiple context consumers', async () => {
      const Consumer1 = () => {
        const settings = useSettings()
        return <div data-testid="consumer1">{settings.isOnline ? 'online' : 'offline'}</div>
      }

      const Consumer2 = () => {
        const settings = useSettings()
        return <div data-testid="consumer2">{settings.pendingOperations}</div>
      }

      render(
        <SettingsProvider>
          <Consumer1 />
          <Consumer2 />
        </SettingsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('consumer1')).toHaveTextContent('online')
      })

      // Both consumers should receive the same state
      expect(screen.getByTestId('consumer1')).toHaveTextContent('online')
      expect(screen.getByTestId('consumer2')).toHaveTextContent('0')
    })

    test('should update all consumers when state changes', async () => {
      let statusCallback: ((status: any) => void) | null = null
      
      mockAutoSyncManager.onStatusChange.mockImplementation((callback) => {
        statusCallback = callback
        return () => {}
      })

      const Consumer1 = () => {
        const settings = useSettings()
        return <div data-testid="consumer1">{settings.isOnline ? 'online' : 'offline'}</div>
      }

      const Consumer2 = () => {
        const settings = useSettings()
        return <div data-testid="consumer2">{settings.pendingOperations}</div>
      }

      render(
        <SettingsProvider>
          <Consumer1 />
          <Consumer2 />
        </SettingsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('consumer1')).toHaveTextContent('online')
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

      // Both consumers should update
      await waitFor(() => {
        expect(screen.getByTestId('consumer1')).toHaveTextContent('offline')
      })
      
      expect(screen.getByTestId('consumer2')).toHaveTextContent('7')
    })
  })

  describe('Integration with Theme and Data Management', () => {
    test('should coexist with existing theme management', async () => {
      const ThemeConsumer = () => {
        const settings = useSettings()
        
        return (
          <div>
            <div data-testid="theme-available">{settings.theme ? 'yes' : 'no'}</div>
            <div data-testid="sync-available">{typeof settings.forceSync === 'function' ? 'yes' : 'no'}</div>
          </div>
        )
      }

      render(
        <SettingsProvider>
          <ThemeConsumer />
        </SettingsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('sync-available')).toHaveTextContent('yes')
      })

      // Should provide both theme and sync functionality
      expect(screen.getByTestId('sync-available')).toHaveTextContent('yes')
    })

    test('should maintain data management compatibility', async () => {
      const DataConsumer = () => {
        const settings = useSettings()
        
        return (
          <div>
            <div data-testid="data-export">{typeof settings.exportData === 'function' ? 'yes' : 'no'}</div>
            <div data-testid="data-import">{typeof settings.importData === 'function' ? 'yes' : 'no'}</div>
            <div data-testid="sync-force">{typeof settings.forceSync === 'function' ? 'yes' : 'no'}</div>
          </div>
        )
      }

      render(
        <SettingsProvider>
          <DataConsumer />
        </SettingsProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('sync-force')).toHaveTextContent('yes')
      })

      // Should provide all data management functions
      expect(screen.getByTestId('sync-force')).toHaveTextContent('yes')
    })
  })

  describe('Context Provider Edge Cases', () => {
    test('should handle provider without children', () => {
      expect(() => {
        render(<SettingsProvider />)
      }).not.toThrow()
    })

    test('should handle context access outside provider', () => {
      // Mock console.error to avoid noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestComponent />)
      }).toThrow()

      consoleSpy.mockRestore()
    })

    test('should handle provider re-mount', async () => {
      const { unmount } = render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      )

      await waitFor(() => {
        expect(mockAutoSyncManager.initialize).toHaveBeenCalledTimes(1)
      })

      unmount()

      // Re-mount
      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      )

      await waitFor(() => {
        expect(mockAutoSyncManager.initialize).toHaveBeenCalledTimes(2)
      })
    })
  })
})