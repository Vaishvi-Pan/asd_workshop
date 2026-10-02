/**
 * tests/productCaching.test.js
 * Comprehensive integration tests for product caching, TTL, headers, and invalidation.
 */

const request = require("supertest");
const app = require("../app");
const cacheService = require("../services/cacheService");
const productDatabase = require("../database/productDatabase");

describe("Product Caching & Layered Architecture Test Suite", () => {
  beforeEach(() => {
    // Reset database and cache before each test
    productDatabase.reset();
    cacheService.reset();
  });

  describe("GET /products Caching & Headers", () => {
    it("should return X-Cache: MISS on the first request and X-Cache: HIT on the second request", async () => {
      // First request -> MISS
      const res1 = await request(app).get("/products");
      expect(res1.status).toBe(200);
      expect(res1.headers["x-cache"]).toBe("MISS");
      expect(res1.body.success).toBe(true);
      expect(Array.isArray(res1.body.data)).toBe(true);
      expect(res1.body.data.length).toBe(5);

      // Second request -> HIT
      const res2 = await request(app).get("/products");
      expect(res2.status).toBe(200);
      expect(res2.headers["x-cache"]).toBe("HIT");
      expect(res2.headers["x-cache-created-at"]).toBeDefined();
      expect(res2.headers["x-cache-ttl"]).toBe("60s");
      expect(res2.body).toEqual(res1.body);
    });

    it("should return X-Cache: MISS then HIT for GET /products/:id", async () => {
      // First request -> MISS
      const res1 = await request(app).get("/products/1");
      expect(res1.status).toBe(200);
      expect(res1.headers["x-cache"]).toBe("MISS");
      expect(res1.body.data.name).toBe("MacBook Pro 16");

      // Second request -> HIT
      const res2 = await request(app).get("/products/1");
      expect(res2.status).toBe(200);
      expect(res2.headers["x-cache"]).toBe("HIT");
      expect(res2.body.data.name).toBe("MacBook Pro 16");
    });
  });

  describe("Cache Invalidation on POST, PUT, PATCH, DELETE", () => {
    it("POST /products should invalidate cached GET /products", async () => {
      // 1. Prime the cache
      const getInitial1 = await request(app).get("/products");
      expect(getInitial1.headers["x-cache"]).toBe("MISS");
      const getInitial2 = await request(app).get("/products");
      expect(getInitial2.headers["x-cache"]).toBe("HIT");

      // 2. Perform POST to create product
      const newProduct = {
        name: "iPad Air M2",
        price: 599.99,
        category: "Tablets",
        description: "11-inch Liquid Retina display",
        inStock: true
      };
      const postRes = await request(app).post("/products").send(newProduct);
      expect(postRes.status).toBe(201);
      expect(postRes.headers["x-cache-invalidated"]).toBe("true");
      expect(postRes.body.data.name).toBe("iPad Air M2");

      // 3. Next GET request must be a MISS and contain the new product from DB
      const getAfterPost = await request(app).get("/products");
      expect(getAfterPost.headers["x-cache"]).toBe("MISS");
      expect(getAfterPost.body.data.length).toBe(6);
      expect(getAfterPost.body.data.some((p) => p.name === "iPad Air M2")).toBe(true);

      // 4. Subsequent GET should be a HIT
      const getAfterPostHit = await request(app).get("/products");
      expect(getAfterPostHit.headers["x-cache"]).toBe("HIT");
    });

    it("PUT /products/:id should invalidate cache for /products and /products/:id", async () => {
      // 1. Prime the cache for both /products and /products/1
      await request(app).get("/products");
      await request(app).get("/products/1");
      expect((await request(app).get("/products/1")).headers["x-cache"]).toBe("HIT");
      expect((await request(app).get("/products")).headers["x-cache"]).toBe("HIT");

      // 2. Update product 1
      const updateData = {
        name: "MacBook Pro 16 M3 Max",
        price: 3499.99,
        category: "Laptops",
        description: "Maxed out specifications",
        inStock: true
      };
      const putRes = await request(app).put("/products/1").send(updateData);
      expect(putRes.status).toBe(200);
      expect(putRes.headers["x-cache-invalidated"]).toBe("true");

      // 3. GET /products/1 must be a MISS and return updated data
      const getUpdated = await request(app).get("/products/1");
      expect(getUpdated.headers["x-cache"]).toBe("MISS");
      expect(getUpdated.body.data.name).toBe("MacBook Pro 16 M3 Max");
      expect(getUpdated.body.data.price).toBe(3499.99);

      // 4. GET /products must also be a MISS
      const getAllAfterPut = await request(app).get("/products");
      expect(getAllAfterPut.headers["x-cache"]).toBe("MISS");
    });

    it("PATCH /products/:id should invalidate cache", async () => {
      // 1. Prime cache
      await request(app).get("/products/2");
      expect((await request(app).get("/products/2")).headers["x-cache"]).toBe("HIT");

      // 2. Patch product 2
      const patchRes = await request(app).patch("/products/2").send({ price: 79.99 });
      expect(patchRes.status).toBe(200);
      expect(patchRes.headers["x-cache-invalidated"]).toBe("true");

      // 3. Next GET /products/2 must be a MISS with fresh price
      const getPatched = await request(app).get("/products/2");
      expect(getPatched.headers["x-cache"]).toBe("MISS");
      expect(getPatched.body.data.price).toBe(79.99);
    });

    it("DELETE /products/:id should invalidate cache and remove product", async () => {
      // 1. Prime cache
      await request(app).get("/products/3");
      expect((await request(app).get("/products/3")).headers["x-cache"]).toBe("HIT");

      // 2. Delete product 3
      const deleteRes = await request(app).delete("/products/3");
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.headers["x-cache-invalidated"]).toBe("true");

      // 3. GET /products/3 should now return 404 (not cached)
      const getDeleted = await request(app).get("/products/3");
      expect(getDeleted.status).toBe(404);

      // 4. GET /products must reflect 4 remaining items
      const getAllAfterDelete = await request(app).get("/products");
      expect(getAllAfterDelete.headers["x-cache"]).toBe("MISS");
      expect(getAllAfterDelete.body.data.length).toBe(4);
    });

    it("Unsuccessful requests (400, 404) must NOT invalidate cache", async () => {
      // Prime cache
      await request(app).get("/products");
      expect((await request(app).get("/products")).headers["x-cache"]).toBe("HIT");

      // Failed POST with missing required fields
      const badPost = await request(app).post("/products").send({ price: -10 });
      expect(badPost.status).toBe(400);

      // Cache should still be intact and return HIT
      const getStillHit = await request(app).get("/products");
      expect(getStillHit.headers["x-cache"]).toBe("HIT");
    });
  });

  describe("Time to Live (TTL) of 1 Minute & Expiration Behavior", () => {
    it("should store creation timestamp and reject expired cache entries (> 1 minute)", async () => {
      // Initial GET -> MISS
      const res1 = await request(app).get("/products/1");
      expect(res1.headers["x-cache"]).toBe("MISS");

      const entry = cacheService.getEntry("/products/1");
      expect(entry).not.toBeNull();
      expect(entry.createdAt).toBeDefined();
      expect(typeof entry.createdAt).toBe("number");
      expect(entry.ttl).toBe(60 * 1000); // 1 minute in ms

      // Request within TTL -> HIT
      const resHit = await request(app).get("/products/1");
      expect(resHit.headers["x-cache"]).toBe("HIT");

      // Simulate time passage beyond 1 minute (61 seconds)
      const fakePastTime = Date.now() - 61 * 1000;
      // Manually adjust the stored createdAt to simulate expiration
      cacheService.store.get("/products/1").createdAt = fakePastTime;

      // When requested after expiration:
      // Must NOT use cached value, must fetch latest data from DB and store fresh value
      const resExpired = await request(app).get("/products/1");
      expect(resExpired.headers["x-cache"]).toBe("MISS");
      expect(resExpired.status).toBe(200);

      // Verify fresh entry was created with new timestamp
      const freshEntry = cacheService.getEntry("/products/1");
      expect(freshEntry.createdAt).toBeGreaterThan(fakePastTime);

      // Immediate subsequent request must be HIT again
      const resFreshHit = await request(app).get("/products/1");
      expect(resFreshHit.headers["x-cache"]).toBe("HIT");
    });
  });

  describe("Layered Structure Validation: Route -> Middleware -> Controller -> Service -> Database", () => {
    it("should properly return 400 when invalid ID is requested", async () => {
      const res = await request(app).get("/products/invalid-id");
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Invalid product ID");
    });

    it("should properly return 404 when non-existent product ID is requested", async () => {
      const res = await request(app).get("/products/9999");
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("not found");
    });
  });
});
