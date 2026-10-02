/**
 * database/productDatabase.js
 * Database layer simulating persistent storage for products.
 * Layered Architecture: Route -> Middleware -> Controller -> Service -> Database
 */

const initialProducts = [
  {
    id: 1,
    name: "MacBook Pro 16",
    price: 2499.99,
    category: "Laptops",
    description: "Apple M3 Pro chip, 18GB Unified Memory, 512GB SSD",
    inStock: true
  },
  {
    id: 2,
    name: "Logitech MX Master 3S",
    price: 99.99,
    category: "Accessories",
    description: "Performance wireless mouse with 8K DPI tracking and quiet clicks",
    inStock: true
  },
  {
    id: 3,
    name: "Keychron Q1 Pro",
    price: 199.99,
    category: "Accessories",
    description: "Custom mechanical keyboard with wireless Bluetooth connectivity",
    inStock: true
  },
  {
    id: 4,
    name: "Dell UltraSharp 27 4K",
    price: 579.99,
    category: "Monitors",
    description: "27-inch 4K UHD IPS monitor with USB-C Hub",
    inStock: false
  },
  {
    id: 5,
    name: "Sony WH-1000XM5",
    price: 398.00,
    category: "Audio",
    description: "Industry leading noise-canceling wireless headphones",
    inStock: true
  }
];

class ProductDatabase {
  constructor() {
    this.reset();
  }

  /**
   * Resets database to default seed data (useful for test runs)
   */
  reset() {
    this.products = JSON.parse(JSON.stringify(initialProducts));
    this.nextId = 6;
  }

  /**
   * Get all products from the database
   * @returns {Promise<Array>} List of products
   */
  async findAll() {
    // Return deep cloned copies
    return JSON.parse(JSON.stringify(this.products));
  }

  /**
   * Find product by ID
   * @param {number} id
   * @returns {Promise<Object|null>} Found product or null
   */
  async findById(id) {
    const product = this.products.find((p) => p.id === Number(id));
    if (!product) return null;
    return JSON.parse(JSON.stringify(product));
  }

  /**
   * Create a new product
   * @param {Object} data
   * @returns {Promise<Object>} Created product
   */
  async create(data) {
    const newProduct = {
      id: this.nextId++,
      name: data.name,
      price: Number(data.price),
      category: data.category || "General",
      description: data.description || "",
      inStock: data.inStock !== undefined ? Boolean(data.inStock) : true,
      createdAt: new Date().toISOString()
    };
    this.products.push(newProduct);
    return JSON.parse(JSON.stringify(newProduct));
  }

  /**
   * Full update of a product (PUT)
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object|null>} Updated product or null
   */
  async update(id, data) {
    const index = this.products.findIndex((p) => p.id === Number(id));
    if (index === -1) return null;

    const updatedProduct = {
      id: Number(id),
      name: data.name,
      price: Number(data.price),
      category: data.category || "General",
      description: data.description || "",
      inStock: data.inStock !== undefined ? Boolean(data.inStock) : true,
      updatedAt: new Date().toISOString()
    };

    this.products[index] = updatedProduct;
    return JSON.parse(JSON.stringify(updatedProduct));
  }

  /**
   * Partial update of a product (PATCH)
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object|null>} Updated product or null
   */
  async patch(id, data) {
    const index = this.products.findIndex((p) => p.id === Number(id));
    if (index === -1) return null;

    const current = this.products[index];
    const patchedProduct = {
      ...current,
      ...data,
      id: Number(id), // ensure id is never overwritten
      price: data.price !== undefined ? Number(data.price) : current.price,
      inStock: data.inStock !== undefined ? Boolean(data.inStock) : current.inStock,
      updatedAt: new Date().toISOString()
    };

    this.products[index] = patchedProduct;
    return JSON.parse(JSON.stringify(patchedProduct));
  }

  /**
   * Delete product by ID
   * @param {number} id
   * @returns {Promise<Object|null>} Deleted product or null
   */
  async delete(id) {
    const index = this.products.findIndex((p) => p.id === Number(id));
    if (index === -1) return null;

    const [deleted] = this.products.splice(index, 1);
    return JSON.parse(JSON.stringify(deleted));
  }
}

// Export singleton instance
module.exports = new ProductDatabase();
