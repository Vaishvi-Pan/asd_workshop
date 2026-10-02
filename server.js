/**
 * server.js
 * Application entry point.
 */

const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  Smart Exam & Workshop - Product Caching Service`);
  console.log(`  Server running at: http://localhost:${PORT}`);
  console.log(`  Architecture: Route -> Middleware -> Controller -> Service -> Database`);
  console.log(`  Cache TTL: 1 minute (60,000 ms)`);
  console.log(`  Endpoints:`);
  console.log(`    - GET    /products      (Cached, 1m TTL)`);
  console.log(`    - GET    /products/:id  (Cached, 1m TTL)`);
  console.log(`    - POST   /products      (Invalidates Cache)`);
  console.log(`    - PUT    /products/:id  (Invalidates Cache)`);
  console.log(`    - PATCH  /products/:id  (Invalidates Cache)`);
  console.log(`    - DELETE /products/:id  (Invalidates Cache)`);
  console.log(`    - GET    /cache/stats   (Inspect Cache)`);
  console.log(`=======================================================`);
});
