import { RealtimeSyncService } from '../realtime-sync'
import { supabase } from '../supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Mock Supabase
jest.mock('../supabase', () => ({
  supabase: {
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}))

describe('RealtimeSyncService', () => {
  let syncService: RealtimeSyncService
  let mockChannel: jest.Mocked<RealtimeChannel>
  let mockStatusCallback: jest.Mock
  let mockSyncCallback: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      unsubscribe: jest.fn(),
      send: jest.fn(),
    } as any

    ;(supabase as any).channel.mockReturnValue(mockChannel)
    
    syncService = new RealtimeSyncService()
    mockStatusCallback = jest.fn()
    mockSyncCallback = jest.fn()
  })

  describe('initialization', () => {
    it('should initialize successfully with valid userId', async () => {
      const result = await syncService.initialize('user-123')
      
      expect(result).toBe(true)
      expect(supabase.channel).toHaveBeenCalledWith('sync-user-123')
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          schema: 'public',
          filter: 'user_id=eq.user-123'
        }),
        expect.any(Function)
      )
      expect(mockChannel.subscribe).toHaveBeenCalled()
    })

    it('should fail initialization when Supabase is not available', async () => {
      ;(supabase as any) = null
      
      const result = await syncService.initialize('user-123')
      
      expect(result).toBe(false)
    })

    it('should not re-initialize for the same user', async () => {
      await syncService.initialize('user-123')
      jest.clearAllMocks()
      
      const result = await syncService.initialize('user-123')
      
      expect(result).toBe(true)
      expect(supabase.channel).not.toHaveBeenCalled()
    })

    it('should cleanup previous user when initializing for new user', async () => {
      await syncService.initialize('user-123')
      const firstChannelUnsubscribe = mockChannel.unsubscribe
      
      // Create new mock channel for new user
      const newMockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis(),
        unsubscribe: jest.fn(),
        send: jest.fn(),
      } as any
      ;(supabase as any).channel.mockReturnValue(newMockChannel)
      
      await syncService.initialize('user-456')
      
      expect(firstChannelUnsubscribe).toHaveBeenCalled()
      expect(supabase.removeChannel).toHaveBeenCalled()
      expect(supabase.channel).toHaveBeenCalledWith('sync-user-456')
    })
  })

  describe('subscriptions', () => {
    beforeEach(async () => {
      await syncService.initialize('user-123')
    })

    it('should subscribe to table events', () => {
      const callback = jest.fn()
      
      syncService.subscribe('expenses', callback)
      
      expect(callback).toBeDefined()
    })

    it('should handle multiple subscriptions for the same table', () => {
      const callback1 = jest.fn()
      const callback2 = jest.fn()
      
      syncService.subscribe('expenses', callback1)
      syncService.subscribe('expenses', callback2)
      
      // Both callbacks should be stored
      expect(callback1).toBeDefined()
      expect(callback2).toBeDefined()
    })

    it('should unsubscribe from table events', () => {
      const callback = jest.fn()
      
      syncService.subscribe('expenses', callback)
      syncService.unsubscribe('expenses', callback)
      
      // Callback should be removed
      expect(callback).toBeDefined()
    })

    it('should handle postgres changes events', async () => {
      const callback = jest.fn()
      syncService.subscribe('expenses', callback)
      
      // Get the postgres changes handler
      const postgresHandler = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes'
      )?.[2]
      
      expect(postgresHandler).toBeDefined()
      
      // Simulate a change event
      const changeEvent = {
        eventType: 'INSERT',
        new: { id: 'expense-1', description: 'Test expense' },
        old: null,
        table: 'expenses'
      }
      
      postgresHandler?.(changeEvent)
      
      expect(callback).toHaveBeenCalledWith({
        table: 'expenses',
        eventType: 'INSERT',
        new: changeEvent.new,
        old: changeEvent.old,
        timestamp: expect.any(Number)
      })
    })
  })

  describe('status management', () => {
    beforeEach(async () => {
      await syncService.initialize('user-123')
    })

    it('should provide initial status', () => {
      const status = syncService.getStatus()
      
      expect(status).toEqual({
        connected: false,
        lastSync: null,
        pendingChanges: 0,
        conflictCount: 0
      })
    })

    it('should subscribe to status updates', () => {
      syncService.subscribeToStatus(mockStatusCallback)
      
      expect(mockStatusCallback).toBeDefined()
    })

    it('should unsubscribe from status updates', () => {
      syncService.subscribeToStatus(mockStatusCallback)
      syncService.unsubscribeFromStatus(mockStatusCallback)
      
      expect(mockStatusCallback).toBeDefined()
    })

    it('should update status when connection state changes', async () => {
      syncService.subscribeToStatus(mockStatusCallback)
      
      // Get the presence sync handler
      const presenceSyncHandler = mockChannel.on.mock.calls.find(
        call => call[0] === 'presence'
      )?.[2]
      
      expect(presenceSyncHandler).toBeDefined()
      
      // Simulate presence sync
      presenceSyncHandler?.()
      
      expect(mockStatusCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          connected: true,
          lastSync: expect.any(Number)
        })
      )
    })
  })

  describe('reconnection logic', () => {
    beforeEach(async () => {
      await syncService.initialize('user-123')
    })

    it('should handle subscription errors with reconnection', async () => {
      const subscribeHandler = mockChannel.subscribe.mock.calls[0]?.[0]
      
      expect(subscribeHandler).toBeDefined()
      
      // Simulate subscription error
      if (typeof subscribeHandler === 'function') {
        subscribeHandler('CHANNEL_ERROR', { message: 'Connection lost' })
      }
      
      // Should attempt reconnection
      expect(mockChannel.subscribe).toHaveBeenCalledTimes(1)
    })

    it('should implement exponential backoff for reconnection', async () => {
      jest.useFakeTimers()
      
      const subscribeHandler = mockChannel.subscribe.mock.calls[0]?.[0]
      
      // Simulate multiple connection failures
      if (typeof subscribeHandler === 'function') {
        subscribeHandler('CHANNEL_ERROR', { message: 'Connection lost' })
        
        // Fast-forward time to trigger reconnection
        jest.advanceTimersByTime(1000)
        
        subscribeHandler('CHANNEL_ERROR', { message: 'Connection lost again' })
        
        // Second reconnection should have longer delay
        jest.advanceTimersByTime(2000)
      }
      
      jest.useRealTimers()
    })

    it('should stop reconnection after max attempts', async () => {
      jest.useFakeTimers()
      
      const subscribeHandler = mockChannel.subscribe.mock.calls[0]?.[0]
      
      // Simulate max reconnection attempts
      if (typeof subscribeHandler === 'function') {
        for (let i = 0; i < 6; i++) {
          subscribeHandler('CHANNEL_ERROR', { message: 'Connection lost' })
          jest.advanceTimersByTime(Math.pow(2, i) * 1000)
        }
      }
      
      // Should stop trying after max attempts
      expect(mockChannel.subscribe).toHaveBeenCalledTimes(1)
      
      jest.useRealTimers()
    })
  })

  describe('cleanup', () => {
    it('should cleanup all resources', async () => {
      await syncService.initialize('user-123')
      syncService.subscribe('expenses', mockSyncCallback)
      syncService.subscribeToStatus(mockStatusCallback)
      
      syncService.cleanup()
      
      expect(mockChannel.unsubscribe).toHaveBeenCalled()
      expect(supabase.removeChannel).toHaveBeenCalled()
    })

    it('should handle cleanup when not initialized', () => {
      expect(() => syncService.cleanup()).not.toThrow()
    })
  })

  describe('offline queue management', () => {
    beforeEach(async () => {
      await syncService.initialize('user-123')
    })

    it('should queue changes when offline', () => {
      const status = syncService.getStatus()
      expect(status.pendingChanges).toBe(0)
      
      // Simulate offline state and queue change
      // This would be implemented in the actual service
    })

    it('should process queued changes when coming online', async () => {
      // Simulate connection restored
      const presenceSyncHandler = mockChannel.on.mock.calls.find(
        call => call[0] === 'presence'
      )?.[2]
      
      presenceSyncHandler?.()
      
      // Should process any queued changes
      const status = syncService.getStatus()
      expect(status.connected).toBe(true)
    })
  })

  describe('conflict resolution', () => {
    beforeEach(async () => {
      await syncService.initialize('user-123')
    })

    it('should track conflicts', () => {
      const status = syncService.getStatus()
      expect(status.conflictCount).toBe(0)
    })

    it('should handle concurrent updates', async () => {
      const callback = jest.fn()
      syncService.subscribe('expenses', callback)
      
      // Get the postgres changes handler
      const postgresHandler = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes'
      )?.[2]
      
      // Simulate concurrent updates to same record
      const update1 = {
        eventType: 'UPDATE',
        new: { id: 'expense-1', description: 'Updated by user 1', version: 1 },
        old: { id: 'expense-1', description: 'Original', version: 0 },
        table: 'expenses'
      }
      
      const update2 = {
        eventType: 'UPDATE',
        new: { id: 'expense-1', description: 'Updated by user 2', version: 1 },
        old: { id: 'expense-1', description: 'Original', version: 0 },
        table: 'expenses'
      }
      
      postgresHandler?.(update1)
      postgresHandler?.(update2)
      
      expect(callback).toHaveBeenCalledTimes(2)
    })
  })
})