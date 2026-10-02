/**
 * services/productService.js
 * Business logic layer for products.
 * Layered Architecture: Route -> Middleware -> Controller -> Service -> Database
 */

const productDatabase = require("../database/productDatabase");

class ProductService {
  /**
   * Retrieve all products from database
   */
  async getAllProducts() {
    return await productDatabase.findAll();
  }

  /**
   * Retrieve single product by ID
   * @param {number|string} id
   */
  async getProductById(id) {
    const numericId = Number(id);
    if (isNaN(numericId) || numericId <= 0) {
      const error = new Error("Invalid product ID. Must be a positive number.");
      error.statusCode = 400;
      throw error;
    }

    const product = await productDatabase.findById(numericId);
    if (!product) {
      const error = new Error(`Product with ID ${numericId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    return product;
  }

  /**
   * Create a new product
   * @param {Object} productData
   */
  async createProduct(productData) {
    if (!productData || typeof productData !== "object") {
      const error = new Error("Product data is required.");
      error.statusCode = 400;
      throw error;
    }

    const { name, price, category, description, inStock } = productData;

    if (!name || typeof name !== "string" || name.trim() === "") {
      const error = new Error("Product name is required and must be a non-empty string.");
      error.statusCode = 400;
      throw error;
    }

    if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
      const error = new Error("Product price is required and must be a non-negative number.");
      error.statusCode = 400;
      throw error;
    }

    return await productDatabase.create({
      name: name.trim(),
      price: Number(price),
      category: category ? String(category).trim() : "General",
      description: description ? String(description).trim() : "",
      inStock: inStock !== undefined ? Boolean(inStock) : true
    });
  }

  /**
   * Update an existing product completely (PUT)
   * @param {number|string} id
   * @param {Object} productData
   */
  async updateProduct(id, productData) {
    const numericId = Number(id);
    if (isNaN(numericId) || numericId <= 0) {
      const error = new Error("Invalid product ID. Must be a positive number.");
      error.statusCode = 400;
      throw error;
    }

    if (!productData || typeof productData !== "object") {
      const error = new Error("Product data is required for update.");
      error.statusCode = 400;
      throw error;
    }

    const { name, price, category, description, inStock } = productData;

    if (!name || typeof name !== "string" || name.trim() === "") {
      const error = new Error("Product name is required and must be a non-empty string.");
      error.statusCode = 400;
      throw error;
    }

    if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
      const error = new Error("Product price is required and must be a non-negative number.");
      error.statusCode = 400;
      throw error;
    }

    const updated = await productDatabase.update(numericId, {
      name: name.trim(),
      price: Number(price),
      category: category ? String(category).trim() : "General",
      description: description ? String(description).trim() : "",
      inStock: inStock !== undefined ? Boolean(inStock) : true
    });

    if (!updated) {
      const error = new Error(`Product with ID ${numericId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    return updated;
  }

  /**
   * Partially update a product (PATCH)
   * @param {number|string} id
   * @param {Object} partialData
   */
  async patchProduct(id, partialData) {
    const numericId = Number(id);
    if (isNaN(numericId) || numericId <= 0) {
      const error = new Error("Invalid product ID. Must be a positive number.");
      error.statusCode = 400;
      throw error;
    }

    if (!partialData || typeof partialData !== "object" || Object.keys(partialData).length === 0) {
      const error = new Error("At least one field is required to patch the product.");
      error.statusCode = 400;
      throw error;
    }

    if (partialData.price !== undefined && (isNaN(Number(partialData.price)) || Number(partialData.price) < 0)) {
      const error = new Error("Product price must be a non-negative number.");
      error.statusCode = 400;
      throw error;
    }

    if (partialData.name !== undefined && (typeof partialData.name !== "string" || partialData.name.trim() === "")) {
      const error = new Error("Product name must be a non-empty string.");
      error.statusCode = 400;
      throw error;
    }

    const patched = await productDatabase.patch(numericId, partialData);

    if (!patched) {
      const error = new Error(`Product with ID ${numericId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    return patched;
  }

  /**
   * Delete a product
   * @param {number|string} id
   */
  async deleteProduct(id) {
    const numericId = Number(id);
    if (isNaN(numericId) || numericId <= 0) {
      const error = new Error("Invalid product ID. Must be a positive number.");
      error.statusCode = 400;
      throw error;
    }

    const deleted = await productDatabase.delete(numericId);
    if (!deleted) {
      const error = new Error(`Product with ID ${numericId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    return deleted;
  }
}

module.exports = new ProductService();
