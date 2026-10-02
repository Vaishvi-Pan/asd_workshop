/**
 * middleware/cacheInvalidateMiddleware.js
 * Cache invalidation middleware for POST, PUT, PATCH, and DELETE requests.
 * Whenever a modifying request successfully alters stored data (2xx response),
 * it invalidates all cache entries that may contain stale data.
 *
 * Layered Architecture: Route -> Middleware -> Controller -> Service -> Database
 */

const cacheService = require("../services/cacheService");

/**
 * Cache Invalidation Middleware factory
 * @param {string|RegExp} [pattern] Key prefix or regex to invalidate (default: "/products")
 */
function cacheInvalidateMiddleware(pattern = "/products") {
  return (req, res, next) => {
    const mutatingMethods = ["POST", "PUT", "PATCH", "DELETE"];

    if (!mutatingMethods.includes(req.method)) {
      return next();
    }

    // Intercept res.json to invalidate cache only if modification succeeds (2xx status)
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const count = cacheService.invalidatePattern(pattern);
        res.setHeader("X-Cache-Invalidated", "true");
        res.setHeader("X-Cache-Invalidated-Count", count.toString());
      }
      return originalJson(body);
    };

    next();
  };
}

module.exports = cacheInvalidateMiddleware;
