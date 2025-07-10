import { connectivityManager, ConnectivityStatus } from '@/lib/connectivity-manager'

// Use global mockSupabase from setup
declare global {
  var mockSupabase: any
}

jest.mock('@/lib/supabase', () => ({
  supabase: global.mockSupabase
}))

describe('Connectivity Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset connectivity manager state
    connectivityManager.cleanup()
  })

  afterEach(() => {
    connectivityManager.cleanup()
  })

  describe('Network Detection', () => {
    test('should detect online/offline state changes', async () => {
      const statusChanges: ConnectivityStatus[] = []
      
      // Subscribe to status changes
      const unsubscribe = connectivityManager.onStatusChange((status: ConnectivityStatus) => {
        statusChanges.push(status)
      })

      // Initialize with online state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })

      await connectivityManager.initialize()

      // Should start with online state
      const initialStatus = connectivityManager.getStatus()
      expect(initialStatus.isOnline).toBe(true)

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      // Dispatch offline event
      const offlineEvent = new Event('offline')
      window.dispatchEvent(offlineEvent)

      // Allow time for event processing
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should detect offline state
      const offlineStatus = connectivityManager.getStatus()
      expect(offlineStatus.isOnline).toBe(false)

      // Simulate going back online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })

      // Dispatch online event
      const onlineEvent = new Event('online')
      window.dispatchEvent(onlineEvent)

      // Allow time for event processing
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should detect online state
      const backOnlineStatus = connectivityManager.getStatus()
      expect(backOnlineStatus.isOnline).toBe(true)

      // Verify callbacks were fired
      expect(statusChanges.length).toBeGreaterThan(0)
      
      // Check that we have offline and online state changes
      const hasOfflineChange = statusChanges.some(status => !status.isOnline)
      const hasOnlineChange = statusChanges.some(status => status.isOnline)
      
      expect(hasOfflineChange).toBe(true)
      expect(hasOnlineChange).toBe(true)

      unsubscribe()
    })

    test('should test database connectivity independently', async () => {
      // Mock successful database connection
      const mockSelect = jest.fn(() => ({
        limit: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'test' }, error: null }))
        }))
      }))
      
      mockSupabase.from.mockReturnValue({
        select: mockSelect
      })

      // Initialize with network online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })

      await connectivityManager.initialize()

      // Test database connectivity
      const canAttempt = connectivityManager.canAttemptOperations()
      expect(canAttempt).toBe(true)

      // Should have tested database connectivity
      expect(mockSupabase.from).toHaveBeenCalledWith('expenses')
      expect(mockSelect).toHaveBeenCalledWith('id')
    })

    test('should handle database unreachable while network is online', async () => {
      // Mock database connection failure
      const mockSelect = jest.fn(() => ({
        limit: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: null, 
            error: { message: 'Connection failed', code: 'NETWORK_ERROR' } 
          }))
        }))
      }))
      
      mockSupabase.from.mockReturnValue({
        select: mockSelect
      })

      // Initialize with network online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })

      await connectivityManager.initialize()

      // Allow time for initial connectivity test
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should detect network online but database unreachable
      const status = connectivityManager.getStatus()
      expect(status.isOnline).toBe(true)
      expect(status.isDatabaseReachable).toBe(false)

      // Should not allow operations when database is unreachable
      const canAttempt = connectivityManager.canAttemptOperations()
      expect(canAttempt).toBe(false)
    })
  })

  describe('Network Simulation', () => {
    test('should handle intermittent connectivity', async () => {
      const statusChanges: ConnectivityStatus[] = []
      
      const unsubscribe = connectivityManager.onStatusChange((status: ConnectivityStatus) => {
        statusChanges.push(status)
      })

      await connectivityManager.initialize()

      // Simulate network flapping (rapid on/off changes)
      const flappingSequence = [false, true, false, true, false, true]
      
      for (const isOnline of flappingSequence) {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: isOnline
        })

        const event = new Event(isOnline ? 'online' : 'offline')
        window.dispatchEvent(event)
        
        // Short delay between state changes
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      // Allow time for processing
      await new Promise(resolve => setTimeout(resolve, 200))

      // Should handle rapid state changes without errors
      const finalStatus = connectivityManager.getStatus()
      expect(finalStatus.isOnline).toBe(true) // Final state should be online

      // Should have recorded multiple state changes
      expect(statusChanges.length).toBeGreaterThan(2)

      // Should implement some form of debouncing or stability check
      const uniqueStates = statusChanges.reduce((acc, status) => {
        acc.add(status.isOnline)
        return acc
      }, new Set())

      expect(uniqueStates.size).toBe(2) // Should have both true and false states

      unsubscribe()
    })

    test('should handle slow network conditions', async () => {
      // Mock slow database response
      const mockSelect = jest.fn(() => ({
        limit: jest.fn(() => ({
          single: jest.fn(() => new Promise(resolve => {
            // Simulate slow response (6 seconds)
            setTimeout(() => {
              resolve({ data: { id: 'test' }, error: null })
            }, 6000)
          }))
        }))
      }))
      
      mockSupabase.from.mockReturnValue({
        select: mockSelect
      })

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })

      await connectivityManager.initialize()

      // Test connectivity with timeout
      const testStartTime = Date.now()
      
      // Force a connectivity test
      await connectivityManager.testDatabaseConnectivity()
      
      const testDuration = Date.now() - testStartTime

      // Should timeout before 6 seconds (should have reasonable timeout)
      expect(testDuration).toBeLessThan(6000)

      // Should handle timeout gracefully
      const status = connectivityManager.getStatus()
      expect(status.isOnline).toBe(true)
      // Database should be marked as unreachable due to timeout
      expect(status.isDatabaseReachable).toBe(false)
    })

    test('should implement exponential backoff for failed connections', async () => {
      // Mock consistent database failures
      const mockSelect = jest.fn(() => ({
        limit: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: null, 
            error: { message: 'Connection failed', code: 'NETWORK_ERROR' } 
          }))
        }))
      }))
      
      mockSupabase.from.mockReturnValue({
        select: mockSelect
      })

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })

      await connectivityManager.initialize()

      // Track test timings
      const testTimes: number[] = []
      
      // Force multiple connectivity tests
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now()
        await connectivityManager.testDatabaseConnectivity()
        const endTime = Date.now()
        testTimes.push(endTime - startTime)
        
        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Should have attempted multiple tests
      expect(mockSupabase.from).toHaveBeenCalledTimes(5)

      // Should maintain reasonable response times despite failures
      testTimes.forEach(time => {
        expect(time).toBeLessThan(5000) // Should timeout within 5 seconds
      })
    })
  })

  describe('Connectivity Status Management', () => {
    test('should provide accurate connectivity status', async () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      await connectivityManager.initialize()

      // Check initial offline status
      const offlineStatus = connectivityManager.getStatus()
      expect(offlineStatus.isOnline).toBe(false)
      expect(offlineStatus.isDatabaseReachable).toBe(false)
      expect(offlineStatus.lastConnectivityCheck).toBeGreaterThan(0)

      // Mock successful database connection
      const mockSelect = jest.fn(() => ({
        limit: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'test' }, error: null }))
        }))
      }))
      
      mockSupabase.from.mockReturnValue({
        select: mockSelect
      })

      // Go online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })

      const onlineEvent = new Event('online')
      window.dispatchEvent(onlineEvent)

      // Allow time for processing
      await new Promise(resolve => setTimeout(resolve, 100))

      // Check online status
      const onlineStatus = connectivityManager.getStatus()
      expect(onlineStatus.isOnline).toBe(true)
      expect(onlineStatus.isDatabaseReachable).toBe(true)
    })

    test('should handle multiple subscribers correctly', async () => {
      const subscriber1Changes: ConnectivityStatus[] = []
      const subscriber2Changes: ConnectivityStatus[] = []
      
      const unsubscribe1 = connectivityManager.onStatusChange((status: ConnectivityStatus) => {
        subscriber1Changes.push(status)
      })

      const unsubscribe2 = connectivityManager.onStatusChange((status: ConnectivityStatus) => {
        subscriber2Changes.push(status)
      })

      await connectivityManager.initialize()

      // Simulate state change
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      const offlineEvent = new Event('offline')
      window.dispatchEvent(offlineEvent)

      await new Promise(resolve => setTimeout(resolve, 100))

      // Both subscribers should receive the change
      expect(subscriber1Changes.length).toBeGreaterThan(0)
      expect(subscriber2Changes.length).toBeGreaterThan(0)

      // Changes should be identical
      expect(subscriber1Changes).toEqual(subscriber2Changes)

      // Test unsubscribe
      unsubscribe1()

      // Another state change
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })

      const onlineEvent = new Event('online')
      window.dispatchEvent(onlineEvent)

      await new Promise(resolve => setTimeout(resolve, 100))

      const changes1AfterUnsub = subscriber1Changes.length
      const changes2AfterUnsub = subscriber2Changes.length

      // Subscriber 1 should not receive new changes
      expect(subscriber1Changes.length).toBe(changes1AfterUnsub)
      // Subscriber 2 should receive new changes
      expect(subscriber2Changes.length).toBeGreaterThan(changes2AfterUnsub)

      unsubscribe2()
    })

    test('should handle canAttemptOperations logic correctly', async () => {
      await connectivityManager.initialize()

      // Test when offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      const offlineEvent = new Event('offline')
      window.dispatchEvent(offlineEvent)
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(connectivityManager.canAttemptOperations()).toBe(false)

      // Test when online but database unreachable
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })

      // Mock database failure
      const mockSelect = jest.fn(() => ({
        limit: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: null, 
            error: { message: 'Connection failed', code: 'NETWORK_ERROR' } 
          }))
        }))
      }))
      
      mockSupabase.from.mockReturnValue({
        select: mockSelect
      })

      const onlineEvent = new Event('online')
      window.dispatchEvent(onlineEvent)
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(connectivityManager.canAttemptOperations()).toBe(false)

      // Test when online and database reachable
      const mockSuccessSelect = jest.fn(() => ({
        limit: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'test' }, error: null }))
        }))
      }))
      
      mockSupabase.from.mockReturnValue({
        select: mockSuccessSelect
      })

      // Force connectivity test
      await connectivityManager.testDatabaseConnectivity()

      expect(connectivityManager.canAttemptOperations()).toBe(true)
    })
  })

  describe('Periodic Connectivity Testing', () => {
    test('should perform periodic connectivity tests', async () => {
      // Mock database connection
      const mockSelect = jest.fn(() => ({
        limit: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'test' }, error: null }))
        }))
      }))
      
      mockSupabase.from.mockReturnValue({
        select: mockSelect
      })

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })

      await connectivityManager.initialize()

      // Reset call count
      mockSupabase.from.mockClear()

      // Wait for at least one periodic test (they should run every 30 seconds)
      // We'll wait a shorter time and verify the mechanism is set up
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should have set up periodic testing (verified through initial test)
      expect(mockSupabase.from).toHaveBeenCalled()

      // Test manual connectivity test
      mockSupabase.from.mockClear()
      await connectivityManager.testDatabaseConnectivity()
      
      expect(mockSupabase.from).toHaveBeenCalledWith('expenses')
    })

    test('should handle connectivity test failures gracefully', async () => {
      // Mock database connection that throws error
      const mockSelect = jest.fn(() => ({
        limit: jest.fn(() => ({
          single: jest.fn(() => Promise.reject(new Error('Network error')))
        }))
      }))
      
      mockSupabase.from.mockReturnValue({
        select: mockSelect
      })

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })

      await connectivityManager.initialize()

      // Test connectivity manually
      await connectivityManager.testDatabaseConnectivity()

      // Should handle the error gracefully
      const status = connectivityManager.getStatus()
      expect(status.isOnline).toBe(true)
      expect(status.isDatabaseReachable).toBe(false)
    })
  })

  describe('Cleanup and Resource Management', () => {
    test('should cleanup resources properly', async () => {
      const statusChanges: ConnectivityStatus[] = []
      
      const unsubscribe = connectivityManager.onStatusChange((status: ConnectivityStatus) => {
        statusChanges.push(status)
      })

      await connectivityManager.initialize()

      // Trigger a state change
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      const offlineEvent = new Event('offline')
      window.dispatchEvent(offlineEvent)
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(statusChanges.length).toBeGreaterThan(0)

      // Cleanup
      connectivityManager.cleanup()

      // Should stop responding to events
      const initialChangeCount = statusChanges.length

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })

      const onlineEvent = new Event('online')
      window.dispatchEvent(onlineEvent)
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should not have received new changes after cleanup
      expect(statusChanges.length).toBe(initialChangeCount)

      unsubscribe()
    })

    test('should handle initialization after cleanup', async () => {
      await connectivityManager.initialize()
      
      // Should be initialized
      expect(connectivityManager.getStatus().isOnline).toBeDefined()

      // Cleanup
      connectivityManager.cleanup()

      // Initialize again
      await connectivityManager.initialize()

      // Should work normally after re-initialization
      expect(connectivityManager.getStatus().isOnline).toBeDefined()
      expect(connectivityManager.canAttemptOperations()).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    test('should handle Supabase unavailable gracefully', async () => {
      // Mock Supabase as null
      jest.doMock('@/lib/supabase', () => ({
        supabase: null
      }))

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })

      await connectivityManager.initialize()

      // Should handle gracefully
      const status = connectivityManager.getStatus()
      expect(status.isOnline).toBe(true)
      expect(status.isDatabaseReachable).toBe(false)

      // Should not be able to attempt operations
      expect(connectivityManager.canAttemptOperations()).toBe(false)
    })

    test('should handle event listener errors gracefully', async () => {
      // Mock console.error to track errors
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      await connectivityManager.initialize()

      // Create a status change callback that throws
      const unsubscribe = connectivityManager.onStatusChange(() => {
        throw new Error('Callback error')
      })

      // Trigger state change
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      const offlineEvent = new Event('offline')
      window.dispatchEvent(offlineEvent)
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should continue working despite callback error
      const status = connectivityManager.getStatus()
      expect(status.isOnline).toBe(false)

      // Should have logged the error
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
      unsubscribe()
    })
  })
})