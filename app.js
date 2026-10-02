/**
 * app.js
 * Express Application configuration and middleware setup.
 *
 * Layered Architecture:
 * Route -> Middleware -> Controller -> Service -> Database
 */

const express = require("express");
const path = require("path");
const productRoutes = require("./routes/productRoutes");
const cacheService = require("./services/cacheService");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware for workshop visibility
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const cacheHeader = res.getHeader("X-Cache") || "-";
    const invalidatedHeader = res.getHeader("X-Cache-Invalidated") ? " [CACHE INVALIDATED]" : "";
    console.log(
      `[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms) Cache: ${cacheHeader}${invalidatedHeader}`
    );
  });
  next();
});

// Serve static frontend files (interactive workshop dashboard)
app.use(express.static(path.join(__dirname, "public")));

// Mount product routes at root `/products` as specified in requirements
app.use("/products", productRoutes);

// Cache inspection and management endpoints for workshop demos
app.get("/cache/stats", (req, res) => {
  res.json({
    success: true,
    cache: cacheService.getStats()
  });
});

app.delete("/cache", (req, res) => {
  const count = cacheService.invalidateAll();
  res.json({
    success: true,
    message: `Cache cleared (${count} entries invalidated).`
  });
});

// 404 handler for unknown routes
app.use((req, res, next) => {
  const error = new Error(`Cannot ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
