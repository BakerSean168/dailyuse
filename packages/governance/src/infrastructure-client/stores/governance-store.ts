/**
 * GovernanceStore - Local Storage/Cache
 * 治理数据本地存储
 * 
 * Provides client-side caching for governance data:
 * - localStorage for persistence
 * - In-memory cache for performance
 * - Automatic cache invalidation
 * 
 * Framework-agnostic - can be used with Vue, React, or vanilla JS
 */

import type { RuleClientDTO } from '@/contracts';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // milliseconds
}

/**
 * Governance Store
 * 
 * Simple cache implementation for client-side rule storage
 */
export class GovernanceStore {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly CACHE_PREFIX = 'governance:';
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Gets cached rules list
   */
  getRules(): RuleClientDTO[] | null {
    return this.get<RuleClientDTO[]>('rules:list');
  }

  /**
   * Sets rules list in cache
   */
  setRules(rules: RuleClientDTO[], ttl: number = this.DEFAULT_TTL): void {
    this.set('rules:list', rules, ttl);
  }

  /**
   * Gets single cached rule by ID
   */
  getRule(id: string): RuleClientDTO | null {
    return this.get<RuleClientDTO>(`rule:${id}`);
  }

  /**
   * Sets single rule in cache
   */
  setRule(rule: RuleClientDTO, ttl: number = this.DEFAULT_TTL): void {
    this.set(`rule:${rule.id}`, rule, ttl);
  }

  /**
   * Clears all cached rules
   */
  clearRules(): void {
    this.cache.clear();
    this.clearLocalStorage();
  }

  /**
   * Generic get from cache
   */
  private get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return this.getFromLocalStorage<T>(key);
    }

    // Check if expired
    if (Date.now() > entry.timestamp + entry.expiresIn) {
      this.cache.delete(key);
      this.removeFromLocalStorage(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Generic set to cache
   */
  private set<T>(key: string, data: T, ttl: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresIn: ttl,
    };

    this.cache.set(key, entry);
    this.saveToLocalStorage(key, entry);
  }

  /**
   * Gets from localStorage
   */
  private getFromLocalStorage<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.CACHE_PREFIX + key);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      
      // Check if expired
      if (Date.now() > entry.timestamp + entry.expiresIn) {
        this.removeFromLocalStorage(key);
        return null;
      }

      // Restore to memory cache
      this.cache.set(key, entry);
      return entry.data;
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return null;
    }
  }

  /**
   * Saves to localStorage
   */
  private saveToLocalStorage<T>(key: string, entry: CacheEntry<T>): void {
    try {
      localStorage.setItem(this.CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  /**
   * Removes from localStorage
   */
  private removeFromLocalStorage(key: string): void {
    try {
      localStorage.removeItem(this.CACHE_PREFIX + key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  }

  /**
   * Clears all governance data from localStorage
   */
  private clearLocalStorage(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }
}

/**
 * Singleton instance
 */
export const governanceStore = new GovernanceStore();
