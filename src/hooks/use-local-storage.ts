"use client"

import { useState, useEffect, useCallback } from "react"

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T | null>(null)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      setStoredValue(item ? JSON.parse(item) : initialValue)
    } catch (error) {
      console.error(error)
      setStoredValue(initialValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue as T) : value
      setStoredValue(valueToStore)
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(error)
    }
  }, [key, storedValue])

  return [storedValue, setValue] as const
}
