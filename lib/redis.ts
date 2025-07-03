// Redis client configuration for property search caching
// Using Upstash Redis for serverless architecture

import { Redis } from '@upstash/redis'

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Cache duration constants (in seconds)
export const CACHE_DURATIONS = {
  PROPERTY_SEARCH: 300,        // 5 minutes - property search results
  PROPERTY_DETAIL: 900,        // 15 minutes - individual property details
  PROPERTY_FILTERS: 120,       // 2 minutes - filter counts and options
  FEATURED_PROPERTIES: 600,    // 10 minutes - homepage featured properties
  PROPERTY_STATS: 1800,        // 30 minutes - property statistics
} as const

// Cache key generators
export const CACHE_KEYS = {
  propertySearch: (params: URLSearchParams) => `property-search:${params.toString()}`,
  propertyDetail: (id: string) => `property:${id}`,
  propertyFilters: (location?: string) => `property-filters:${location || 'all'}`,
  featuredProperties: () => 'featured-properties',
  propertyStats: () => 'property-stats',
} as const

// Cache helper functions
export class PropertyCache {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key)
      return value as T
    } catch (error) {
      console.warn('Cache get error:', error)
      return null
    }
  }

  static async set<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.warn('Cache set error:', error)
      // Don't throw - cache failures shouldn't break functionality
    }
  }

  static async del(pattern: string): Promise<void> {
    try {
      // For pattern-based deletion, we'll use a simple approach
      // In production, consider using Redis SCAN for large datasets
      if (pattern.endsWith('*')) {
        const keys = await redis.keys(pattern)
        if (keys.length > 0) {
          await redis.del(...keys)
        }
      } else {
        await redis.del(pattern)
      }
    } catch (error) {
      console.warn('Cache delete error:', error)
    }
  }

  // Specific cache methods for property search
  static async getSearchResults(searchParams: URLSearchParams) {
    const cacheKey = CACHE_KEYS.propertySearch(searchParams)
    return await this.get<{
      properties: any[]
      total: number
      page: number
      pageSize: number
      totalPages: number
      searchType: string
      filters: any
      cachedAt: string
    }>(cacheKey)
  }

  static async setSearchResults(
    searchParams: URLSearchParams, 
    results: any, 
    ttl: number = CACHE_DURATIONS.PROPERTY_SEARCH
  ) {
    const cacheKey = CACHE_KEYS.propertySearch(searchParams)
    const cachedData = {
      ...results,
      cachedAt: new Date().toISOString()
    }
    await this.set(cacheKey, cachedData, ttl)
  }

  // Clear search cache when properties are updated
  static async clearSearchCache() {
    await this.del('property-search:*')
    await this.del(CACHE_KEYS.featuredProperties())
    await this.del(CACHE_KEYS.propertyStats())
  }

  // Clear specific property cache
  static async clearPropertyCache(propertyId: string) {
    await this.del(CACHE_KEYS.propertyDetail(propertyId))
    // Also clear search cache as this property might appear in searches
    await this.clearSearchCache()
  }
}

// Health check for Redis connection
export async function checkRedisConnection(): Promise<boolean> {
  try {
    await redis.ping()
    return true
  } catch (error) {
    console.error('Redis connection failed:', error)
    return false
  }
}

export default redis