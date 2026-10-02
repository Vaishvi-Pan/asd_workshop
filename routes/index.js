/**
 * routes/index.js
 * Main router aggregator.
 */

const express = require("express");
const router = express.Router();
const productRoutes = require("./productRoutes");
const cacheService = require("../services/cacheService");

// Mount product routes under /products
router.use("/products", productRoutes);

// Helper endpoint for monitoring cache state during testing/workshop demos
router.get("/cache/stats", (req, res) => {
  res.json({
    success: true,
    cache: cacheService.getStats()
  });
});

// Helper endpoint to manually clear cache if needed
router.delete("/cache", (req, res) => {
  const count = cacheService.invalidateAll();
  res.json({
    success: true,
    message: `Cache cleared (${count} entries invalidated).`
  });
});

module.exports = router;
