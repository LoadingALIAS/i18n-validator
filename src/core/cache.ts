/**
 * Simple in-memory cache implementation for validation results
 * Provides caching layer to avoid repetitive validations of the same input
 */
import type { CacheOptions } from '../types';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export class ValidationCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>();
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 1000;
    this.ttl = options.ttl || 3600000; // Default: 1 hour
  }

  /**
   * Get a value from the cache if available and not expired
   */
  get(key: K): V | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if the entry has expired
    if (this.ttl > 0 && Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  /**
   * Store a value in the cache
   */
  set(key: K, value: V): void {
    // If cache is at capacity, remove the oldest item
    if (this.cache.size >= this.maxSize) {
      const iterator = this.cache.keys();
      const firstKey = iterator.next();
      
      // Make sure we have a valid key before deleting
      if (!firstKey.done && firstKey.value !== undefined) {
        this.cache.delete(firstKey.value);
      }
    }
    
    this.cache.set(key, { 
      value, 
      timestamp: Date.now() 
    });
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the current size of the cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get a value from cache if it exists, otherwise compute and cache it
   */
  getOrSet(key: K, computeFn: () => V): V {
    const cachedValue = this.get(key);
    if (cachedValue !== null) return cachedValue;
    
    const newValue = computeFn();
    this.set(key, newValue);
    return newValue;
  }
} 