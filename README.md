# Express Product Caching Application & Layered Architecture Workshop

A production-grade Node.js / Express application demonstrating high-performance in-memory caching, 1-minute Time-to-Live (TTL), automated cache invalidation upon mutations, and a strict layered architecture pattern.

---

## 🏛️ Layered Request Architecture

Every request strictly follows the clean separation of concerns:

$$\text{Route} \longrightarrow \text{Middleware} \longrightarrow \text{Controller} \longrightarrow \text{Service} \longrightarrow \text{Database}$$

```
┌─────────────┐       ┌───────────────────────┐       ┌────────────────────┐       ┌────────────────────┐       ┌───────────────────┐
│   ROUTES    │ ───>  │      MIDDLEWARE       │ ───>  │    CONTROLLER      │ ───>  │      SERVICE       │ ───>  │     DATABASE      │
│ (Endpoints) │       │ (Cache & Invalidator) │       │ (HTTP & Statuses)  │       │  (Business Logic)  │       │ (In-memory Store) │
└─────────────┘       └───────────────────────┘       └────────────────────┘       └────────────────────┘       └───────────────────┘
```

1. **Route (`routes/`)**: Defines URL route mappings and attaches appropriate middleware.
2. **Middleware (`middleware/`)**:
   - For `GET`: Inspects cache. If a fresh entry exists, immediately returns `X-Cache: HIT` (short-circuiting downstream layers). If expired or missing, attaches `X-Cache: MISS` and hooks the outgoing response to save fresh data.
   - For `POST`, `PUT`, `PATCH`, `DELETE`: Monitors response completion; if data is successfully modified (2xx status), immediately invalidates stale cache entries.
3. **Controller (`controllers/`)**: Parses incoming request params/body and formats HTTP responses.
4. **Service (`services/`)**: Implements business rules, validation, and coordinates domain logic.
5. **Database (`database/`)**: Manages data persistence and CRUD operations.

---

## 📁 Project Directory Structure

```
asd_workshop/
├── routes/
│   ├── index.js                  # Main route aggregator & cache inspection endpoints
│   └── productRoutes.js          # Product routes with attached cache middleware
├── controllers/
│   └── productController.js      # HTTP request & response handlers
├── services/
│   ├── cacheService.js           # Cache engine (1 min TTL, timestamps, invalidation)
│   └── productService.js         # Product business logic and validations
├── database/
│   └── productDatabase.js        # Persistent in-memory data store with CRUD operations
├── middleware/
│   ├── cacheMiddleware.js        # GET caching middleware with HIT/MISS headers
│   ├── cacheInvalidateMiddleware.js # Mutation invalidator for POST/PUT/PATCH/DELETE
│   └── errorHandler.js           # Centralized JSON error handling
├── public/                       # Interactive visual workshop dashboard
│   ├── index.html
│   ├── app.css
│   └── app.js
├── tests/
│   └── productCaching.test.js    # Automated Jest & Supertest integration tests
├── app.js                        # Express app configuration
├── server.js                     # Server entry point
├── package.json
└── README.md
```

---

## ⚡ Caching & Invalidation Behavior

### 1. Cache HIT and MISS Headers
- **`X-Cache: MISS`**: Returned when the requested URL is not in cache or has expired. The database is queried and the fresh value is stored in cache.
- **`X-Cache: HIT`**: Returned when a valid, non-expired cache entry exists. The controller, service, and database layers are skipped.
- Additional diagnostic headers:
  - `X-Cache-Created-At`: ISO timestamp of when the cache entry was created.
  - `X-Cache-Age`: Elapsed seconds since creation.
  - `X-Cache-TTL`: Total Time to Live (default: `60s`).
  - `X-Cache-Invalidated`: Present on successful mutating operations (`POST`, `PUT`, `PATCH`, `DELETE`).

### 2. Time-to-Live (TTL) of 1 Minute (60 seconds)
- When data is cached, the exact creation timestamp (`createdAt = Date.now()`) is recorded.
- On each subsequent request:
  $$\text{age} = \text{Date.now}() - \text{entry.createdAt}$$
- If $\text{age} > 60{,}000\text{ ms}$:
  - The stale cache entry is purged.
  - The request proceeds as a **MISS**.
  - Fresh data is fetched from the database and newly cached with a fresh timestamp.

### 3. Automated Cache Invalidation on Mutations
- Whenever a `POST`, `PUT`, `PATCH`, or `DELETE` request successfully modifies stored data (status code in the `200..299` range), the middleware automatically invalidates all cache entries matching `/products*`.
- Failed requests (such as `400 Bad Request` or `404 Not Found`) do **not** modify stored data and do **not** invalidate the cache.

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
# or
npm start
```

The application will start on `http://localhost:3000`.

### 3. Interactive Web Dashboard
Open your browser at `http://localhost:3000` to interactively:
- Fire `GET /products` and observe `X-Cache: MISS` transition to `X-Cache: HIT`.
- Watch the live 1-minute TTL countdown timer.
- Trigger `POST`, `PUT`, `PATCH`, and `DELETE` requests to see instant cache invalidation.
- View real-time pipeline animations showing short-circuiting on cache HITs.

---

## 🧪 Running Automated Tests

Run the complete integration test suite:

```bash
npm test
```

### Test Coverage Highlights:
- ✅ First `GET /products` returns `X-Cache: MISS`
- ✅ Subsequent `GET /products` returns `X-Cache: HIT` with identical body
- ✅ First `GET /products/:id` returns `X-Cache: MISS`, second returns `X-Cache: HIT`
- ✅ `POST /products` creates product and invalidates cached `GET /products`
- ✅ `PUT /products/:id` updates product and invalidates both `/products` and `/products/:id`
- ✅ `PATCH /products/:id` partially updates and invalidates cache
- ✅ `DELETE /products/:id` deletes product and invalidates cache
- ✅ Unsuccessful requests (`400`, `404`) do not invalidate cache
- ✅ Cache expiration: entries older than 1 minute are rejected and refetched fresh from the database
- ✅ Input validation and error handling (400, 404, 500)

---

## 📡 API Reference & cURL Examples

### 1. Get All Products (Cached)
```bash
# First call -> X-Cache: MISS
curl -i http://localhost:3000/products

# Second call within 1 min -> X-Cache: HIT
curl -i http://localhost:3000/products
```

### 2. Get Product By ID (Cached)
```bash
# First call -> X-Cache: MISS
curl -i http://localhost:3000/products/1

# Second call -> X-Cache: HIT
curl -i http://localhost:3000/products/1
```

### 3. Create Product (Invalidates Cache)
```bash
curl -i -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Studio Display", "price": 1599.00, "category": "Monitors"}'
```

### 4. Fully Update Product (Invalidates Cache)
```bash
curl -i -X PUT http://localhost:3000/products/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "MacBook Pro 16 M3 Max", "price": 3499.00, "category": "Laptops", "inStock": true}'
```

### 5. Partially Update Product (Invalidates Cache)
```bash
curl -i -X PATCH http://localhost:3000/products/2 \
  -H "Content-Type: application/json" \
  -d '{"price": 89.99}'
```

### 6. Delete Product (Invalidates Cache)
```bash
curl -i -X DELETE http://localhost:3000/products/5
```

### 7. Inspect Cache Statistics
```bash
curl -i http://localhost:3000/cache/stats
```
