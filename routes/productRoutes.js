/**
 * routes/productRoutes.js
 * Product routes wiring middleware and controllers.
 * Layered Architecture: Route -> Middleware -> Controller -> Service -> Database
 */

const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const cacheMiddleware = require("../middleware/cacheMiddleware");
const cacheInvalidateMiddleware = require("../middleware/cacheInvalidateMiddleware");

// GET /products - cached with 1 minute TTL
router.get(
  "/",
  cacheMiddleware(),
  productController.getAllProducts.bind(productController)
);

// GET /products/:id - cached with 1 minute TTL
router.get(
  "/:id",
  cacheMiddleware(),
  productController.getProductById.bind(productController)
);

// POST /products - creates product and invalidates product cache on success
router.post(
  "/",
  cacheInvalidateMiddleware("/products"),
  productController.createProduct.bind(productController)
);

// PUT /products/:id - updates product and invalidates product cache on success
router.put(
  "/:id",
  cacheInvalidateMiddleware("/products"),
  productController.updateProduct.bind(productController)
);

// PATCH /products/:id - partially updates product and invalidates product cache on success
router.patch(
  "/:id",
  cacheInvalidateMiddleware("/products"),
  productController.patchProduct.bind(productController)
);

// DELETE /products/:id - deletes product and invalidates product cache on success
router.delete(
  "/:id",
  cacheInvalidateMiddleware("/products"),
  productController.deleteProduct.bind(productController)
);

module.exports = router;
