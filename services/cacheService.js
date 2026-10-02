/**
 * services/cacheService.js
 * In-memory Cache Service implementing:
 * - 1-minute default Time To Live (TTL)
 * - Storage of entry creation timestamp
 * - Expiration check upon retrieval
 * - Cache invalidation when data is modified
 */

class CacheService {
  /**
   * @param {number} defaultTtlMs Time To Live in milliseconds (default: 60,000 ms = 1 minute)
   */
  constructor(defaultTtlMs = 60 * 1000) {
    this.defaultTtlMs = defaultTtlMs;
    this.store = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      invalidations: 0
    };
  }

  /**
   * Retrieve cached data by key.
   * If entry is older than TTL, deletes it and returns null (cache miss/expired).
   * @param {string} key
   * @returns {any|null} The cached data if valid, or null if missing/expired
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    const age = now - entry.createdAt;

    // Check if entry has expired (older than TTL)
    if (age > entry.ttl) {
      // Expired: do not use cached value, remove stale entry
      this.store.delete(key);
      this.stats.misses++;
      return null;
    }

    // Cache HIT
    this.stats.hits++;
    return JSON.parse(JSON.stringify(entry.data));
  }

  /**
   * Retrieve full entry metadata (useful for headers and debugging)
   * @param {string} key
   * @returns {Object|null}
   */
  getEntry(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    const now = Date.now();
    const age = now - entry.createdAt;
    const isExpired = age > entry.ttl;

    return {
      key,
      data: entry.data,
      createdAt: entry.createdAt,
      createdAtIso: new Date(entry.createdAt).toISOString(),
      ttl: entry.ttl,
      ageMs: age,
      ageSeconds: Math.floor(age / 1000),
      isExpired
    };
  }

  /**
   * Store data in cache along with its creation timestamp and TTL.
   * @param {string} key
   * @param {any} data
   * @param {number} [ttl] Custom TTL in milliseconds (defaults to 60000ms)
   */
  set(key, data, ttl = this.defaultTtlMs) {
    const entry = {
      data: JSON.parse(JSON.stringify(data)),
      createdAt: Date.now(),
      ttl
    };
    this.store.set(key, entry);
  }

  /**
   * Delete a specific cache key
   * @param {string} key
   */
  delete(key) {
    this.store.delete(key);
  }

  /**
   * Invalidate all cache entries matching a prefix or pattern (or all entries if none specified).
   * Used whenever POST, PUT, PATCH, or DELETE modifies data.
   * @param {string|RegExp} [pattern]
   */
  invalidatePattern(pattern) {
    if (!pattern) {
      const count = this.store.size;
      this.store.clear();
      this.stats.invalidations += count;
      return count;
    }

    let count = 0;
    for (const key of this.store.keys()) {
      const shouldInvalidate =
        pattern instanceof RegExp
          ? pattern.test(key)
          : key.startsWith(pattern) || key.includes(pattern);

      if (shouldInvalidate) {
        this.store.delete(key);
        count++;
      }
    }
    this.stats.invalidations += count;
    return count;
  }

  /**
   * Invalidate all cache entries
   */
  invalidateAll() {
    const count = this.store.size;
    this.store.clear();
    this.stats.invalidations += count;
    return count;
  }

  /**
   * Return size and stats of cache
   */
  getStats() {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
      ...this.stats
    };
  }

  /**
   * Clear cache and reset stats (useful for tests)
   */
  reset() {
    this.store.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      invalidations: 0
    };
  }
}

// Export singleton instance with 1-minute TTL default (60,000 ms)
const cacheService = new CacheService(60 * 1000);
cacheService.CacheService = CacheService;

module.exports = cacheService;
