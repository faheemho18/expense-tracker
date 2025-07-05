import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '../use-local-storage'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('useLocalStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('returns initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'))
    
    expect(result.current[0]).toBe('initial-value')
    expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key')
  })

  it('returns stored value from localStorage', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify('stored-value'))
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'))
    
    expect(result.current[0]).toBe('stored-value')
  })

  it('updates localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'))
    
    act(() => {
      result.current[1]('new-value')
    })
    
    expect(result.current[0]).toBe('new-value')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('new-value'))
  })

  it('handles function updates', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 10))
    
    act(() => {
      result.current[1]((prev: number) => prev + 5)
    })
    
    expect(result.current[0]).toBe(15)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(15))
  })

  it('handles complex objects', () => {
    const initialObject = { name: 'John', age: 30 }
    const updatedObject = { name: 'Jane', age: 25 }
    
    const { result } = renderHook(() => useLocalStorage('test-key', initialObject))
    
    act(() => {
      result.current[1](updatedObject)
    })
    
    expect(result.current[0]).toEqual(updatedObject)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(updatedObject))
  })

  it('handles arrays', () => {
    const initialArray = [1, 2, 3]
    const updatedArray = [4, 5, 6]
    
    const { result } = renderHook(() => useLocalStorage('test-key', initialArray))
    
    act(() => {
      result.current[1](updatedArray)
    })
    
    expect(result.current[0]).toEqual(updatedArray)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(updatedArray))
  })

  it('handles localStorage errors gracefully', () => {
    // Mock localStorage.setItem to throw an error
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('Storage quota exceeded')
    })
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'))
    
    // Should not throw error when localStorage fails
    act(() => {
      result.current[1]('new-value')
    })
    
    // Value should still be updated in state even if localStorage fails
    expect(result.current[0]).toBe('new-value')
  })

  it('handles invalid JSON in localStorage', () => {
    localStorageMock.getItem.mockReturnValue('invalid-json{')
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'))
    
    // Should fall back to initial value when JSON parsing fails
    expect(result.current[0]).toBe('initial-value')
  })

  it('handles null values', () => {
    const { result } = renderHook(() => useLocalStorage<string | null>('test-key', null))
    
    act(() => {
      result.current[1]('not-null')
    })
    
    expect(result.current[0]).toBe('not-null')
    
    act(() => {
      result.current[1](null)
    })
    
    expect(result.current[0]).toBe(null)
  })

  it('uses different keys independently', () => {
    const { result: result1 } = renderHook(() => useLocalStorage('key1', 'value1'))
    const { result: result2 } = renderHook(() => useLocalStorage('key2', 'value2'))
    
    act(() => {
      result1.current[1]('updated1')
    })
    
    expect(result1.current[0]).toBe('updated1')
    expect(result2.current[0]).toBe('value2')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('key1', JSON.stringify('updated1'))
  })
})