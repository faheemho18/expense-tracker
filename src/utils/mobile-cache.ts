// Mobile-specific caching utilities
export interface MobileCacheConfig {
  maxAge: number
  maxSize: number
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate'
}

export class MobileCache {
  private cache: Map<string, { data: any; timestamp: number; size: number }> = new Map()
  private totalSize = 0
  private config: MobileCacheConfig

  constructor(config: MobileCacheConfig) {
    this.config = config
    
    // Load existing cache from IndexedDB if available
    this.loadFromStorage()
  }

  async get(key: string): Promise<any | null> {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    // Check if expired
    if (Date.now() - item.timestamp > this.config.maxAge) {
      this.delete(key)
      return null
    }
    
    return item.data
  }

  async set(key: string, data: any): Promise<void> {
    const size = this.calculateSize(data)
    
    // Remove old entry if exists
    if (this.cache.has(key)) {
      this.totalSize -= this.cache.get(key)!.size
    }
    
    // Ensure we don't exceed max size
    while (this.totalSize + size > this.config.maxSize && this.cache.size > 0) {
      this.evictOldest()
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      size
    })
    
    this.totalSize += size
    
    // Persist to IndexedDB
    this.saveToStorage()
  }

  delete(key: string): boolean {
    const item = this.cache.get(key)
    if (item) {
      this.totalSize -= item.size
      this.cache.delete(key)
      this.saveToStorage()
      return true
    }
    return false
  }

  clear(): void {
    this.cache.clear()
    this.totalSize = 0
    this.clearStorage()
  }

  private evictOldest(): void {
    let oldestKey = ''
    let oldestTime = Date.now()
    
    for (const [key, item] of this.cache) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp
        oldestKey = key
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey)
    }
  }

  private calculateSize(data: any): number {
    return JSON.stringify(data).length * 2 // Rough estimate in bytes
  }

  private async loadFromStorage(): Promise<void> {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem(`mobile-cache-${this.constructor.name}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        this.cache = new Map(parsed.entries)
        this.totalSize = parsed.totalSize
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error)
    }
  }

  private async saveToStorage(): Promise<void> {
    if (typeof window === 'undefined') return
    
    try {
      const toStore = {
        entries: Array.from(this.cache.entries()),
        totalSize: this.totalSize
      }
      localStorage.setItem(`mobile-cache-${this.constructor.name}`, JSON.stringify(toStore))
    } catch (error) {
      console.warn('Failed to save cache to storage:', error)
    }
  }

  private clearStorage(): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(`mobile-cache-${this.constructor.name}`)
    } catch (error) {
      console.warn('Failed to clear cache storage:', error)
    }
  }
}

// Mobile-optimized API cache
export class MobileAPICache extends MobileCache {
  constructor() {
    // Mobile-specific configuration
    super({
      maxAge: 5 * 60 * 1000, // 5 minutes for mobile
      maxSize: 2 * 1024 * 1024, // 2MB max on mobile
      strategy: 'stale-while-revalidate'
    })
  }

  async fetchWithCache(url: string, options?: RequestInit): Promise<any> {
    const cacheKey = this.getCacheKey(url, options)
    
    // Try cache first
    const cached = await this.get(cacheKey)
    
    if (this.config.strategy === 'cache-first' && cached) {
      return cached
    }
    
    try {
      // Fetch from network
      const response = await fetch(url, {
        ...options,
        headers: {
          'Cache-Control': 'max-age=300', // 5 minutes
          ...options?.headers
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      // Cache the response
      await this.set(cacheKey, data)
      
      return data
    } catch (error) {
      // Return cached data if network fails
      if (cached) {
        return cached
      }
      throw error
    }
  }

  private getCacheKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET'
    const body = options?.body ? JSON.stringify(options.body) : ''
    return `${method}:${url}:${body}`
  }
}

// Mobile image cache
export class MobileImageCache extends MobileCache {
  constructor() {
    super({
      maxAge: 24 * 60 * 60 * 1000, // 24 hours for images
      maxSize: 10 * 1024 * 1024, // 10MB for images on mobile
      strategy: 'cache-first'
    })
  }

  async getImageBlob(url: string): Promise<Blob | null> {
    const cached = await this.get(url)
    if (cached) {
      return new Blob([cached.buffer], { type: cached.type })
    }
    return null
  }

  async setImageBlob(url: string, blob: Blob): Promise<void> {
    const buffer = await blob.arrayBuffer()
    await this.set(url, {
      buffer: Array.from(new Uint8Array(buffer)),
      type: blob.type
    })
  }
}

// Cache manager for mobile
export class MobileCacheManager {
  private apiCache: MobileAPICache
  private imageCache: MobileImageCache

  constructor() {
    this.apiCache = new MobileAPICache()
    this.imageCache = new MobileImageCache()
  }

  async fetchAPI(url: string, options?: RequestInit): Promise<any> {
    return this.apiCache.fetchWithCache(url, options)
  }

  async fetchImage(url: string): Promise<Blob | null> {
    // Try cache first
    let blob = await this.imageCache.getImageBlob(url)
    
    if (!blob) {
      try {
        // Fetch from network
        const response = await fetch(url)
        if (response.ok) {
          blob = await response.blob()
          // Cache for future use
          await this.imageCache.setImageBlob(url, blob)
        }
      } catch (error) {
        console.warn('Failed to fetch image:', error)
      }
    }
    
    return blob
  }

  clearAllCaches(): void {
    this.apiCache.clear()
    this.imageCache.clear()
  }

  getCacheStats(): { api: number; images: number } {
    return {
      api: this.apiCache['cache'].size,
      images: this.imageCache['cache'].size
    }
  }
}

// Singleton instance
export const mobileCacheManager = new MobileCacheManager()

// Hook for mobile caching
export function useMobileCache() {
  const fetchWithCache = async (url: string, options?: RequestInit) => {
    return mobileCacheManager.fetchAPI(url, options)
  }

  const fetchImageWithCache = async (url: string) => {
    return mobileCacheManager.fetchImage(url)
  }

  const clearCaches = () => {
    mobileCacheManager.clearAllCaches()
  }

  const getCacheStats = () => {
    return mobileCacheManager.getCacheStats()
  }

  return {
    fetchWithCache,
    fetchImageWithCache,
    clearCaches,
    getCacheStats
  }
}

// Service worker cache strategies for mobile
export const mobileCacheStrategies = {
  // Critical resources - cache first
  critical: {
    strategy: 'CacheFirst',
    cacheName: 'critical-mobile',
    maxEntries: 20,
    maxAgeSeconds: 24 * 60 * 60, // 1 day
  },
  
  // API responses - network first with cache fallback
  api: {
    strategy: 'NetworkFirst',
    cacheName: 'api-mobile',
    maxEntries: 50,
    maxAgeSeconds: 5 * 60, // 5 minutes
    networkTimeoutSeconds: 3,
  },
  
  // Images - cache first with longer expiry
  images: {
    strategy: 'CacheFirst',
    cacheName: 'images-mobile',
    maxEntries: 100,
    maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
  },
  
  // Documents - stale while revalidate
  documents: {
    strategy: 'StaleWhileRevalidate',
    cacheName: 'documents-mobile',
    maxEntries: 30,
    maxAgeSeconds: 24 * 60 * 60, // 1 day
  }
}