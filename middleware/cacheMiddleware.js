/**
 * middleware/cacheMiddleware.js
 * Caching middleware for GET endpoints.
 * - Checks cache for existing unexpired data
 * - Adds 'X-Cache: HIT' header and returns cached data if fresh
 * - Adds 'X-Cache: MISS' header and delegates to Controller -> Service -> Database if absent/expired
 * - Stores fresh data in cache with 1-minute TTL and creation timestamp
 *
 * Layered Architecture: Route -> Middleware -> Controller -> Service -> Database
 */

const cacheService = require("../services/cacheService");

/**
 * Cache middleware factory
 * @param {Object} [options]
 * @param {number} [options.ttl] Custom TTL in ms (defaults to 60,000 ms = 1 minute)
 */
function cacheMiddleware(options = {}) {
  const ttl = options.ttl !== undefined ? options.ttl : 60 * 1000;

  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    const cacheKey = req.originalUrl || req.url;

    // Check if valid, unexpired cached data exists
    const cachedData = cacheService.get(cacheKey);

    if (cachedData !== null) {
      // CACHE HIT
      const entry = cacheService.getEntry(cacheKey);
      res.setHeader("X-Cache", "HIT");
      if (entry) {
        res.setHeader("X-Cache-Created-At", entry.createdAtIso);
        res.setHeader("X-Cache-Age", `${entry.ageSeconds}s`);
        res.setHeader("X-Cache-TTL", `${Math.floor(entry.ttl / 1000)}s`);
      }

      // Short-circuit: return cached response without hitting Controller/Service/Database
      return res.status(200).json(cachedData);
    }

    // CACHE MISS (either not found or expired)
    res.setHeader("X-Cache", "MISS");

    // Intercept res.json to cache fresh response returned by Controller -> Service -> Database
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      // Only cache successful GET responses (status 200..299)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheService.set(cacheKey, body, ttl);
      }
      return originalJson(body);
    };

    // Forward request to Controller
    next();
  };
}

module.exports = cacheMiddleware;
