/**
 * controllers/productController.js
 * Controller layer handling HTTP requests and responses for products.
 * Layered Architecture: Route -> Middleware -> Controller -> Service -> Database
 */

const productService = require("../services/productService");

class ProductController {
  /**
   * GET /products
   * Retrieve all products
   */
  async getAllProducts(req, res, next) {
    try {
      const products = await productService.getAllProducts();
      return res.status(200).json({
        success: true,
        count: products.length,
        data: products
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /products/:id
   * Retrieve single product by ID
   */
  async getProductById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);
      return res.status(200).json({
        success: true,
        data: product
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /products
   * Create a new product
   */
  async createProduct(req, res, next) {
    try {
      const newProduct = await productService.createProduct(req.body);
      return res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: newProduct
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /products/:id
   * Fully update an existing product
   */
  async updateProduct(req, res, next) {
    try {
      const updatedProduct = await productService.updateProduct(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: updatedProduct
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /products/:id
   * Partially update an existing product
   */
  async patchProduct(req, res, next) {
    try {
      const patchedProduct = await productService.patchProduct(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        message: "Product partially updated successfully",
        data: patchedProduct
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /products/:id
   * Delete an existing product
   */
  async deleteProduct(req, res, next) {
    try {
      const deletedProduct = await productService.deleteProduct(req.params.id);
      return res.status(200).json({
        success: true,
        message: "Product deleted successfully",
        data: deletedProduct
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProductController();
