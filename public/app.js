/**
 * public/app.js
 * Client-side script driving the interactive Product Caching Workshop dashboard.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const btnGetAll = document.getElementById("btn-get-all");
  const btnGetOne = document.getElementById("btn-get-one");
  const inputProductId = document.getElementById("input-product-id");
  const btnCreateProduct = document.getElementById("btn-create-product");
  const btnUpdateProduct = document.getElementById("btn-update-product");
  const inputUpdateId = document.getElementById("input-update-id");
  const btnPatchProduct = document.getElementById("btn-patch-product");
  const inputPatchId = document.getElementById("input-patch-id");
  const btnDeleteProduct = document.getElementById("btn-delete-product");
  const inputDeleteId = document.getElementById("input-delete-id");

  const btnRefreshStats = document.getElementById("btn-refresh-cache-stats");
  const btnClearLogs = document.getElementById("btn-clear-logs");

  // Display Elements
  const cacheBadge = document.getElementById("cache-badge");
  const headerStatus = document.getElementById("header-status");
  const headerXCache = document.getElementById("header-xcache");
  const headerTime = document.getElementById("header-time");
  const headerCreated = document.getElementById("header-created");
  const headerTtlCountdown = document.getElementById("header-ttl-countdown");
  const consoleUrl = document.getElementById("console-requested-url");
  const jsonDisplay = document.getElementById("response-json-display");
  const activityLog = document.getElementById("activity-log-list");

  // Metrics
  const statHits = document.getElementById("stat-hits");
  const statMisses = document.getElementById("stat-misses");
  const statSize = document.getElementById("stat-size");
  const statInvalidations = document.getElementById("stat-invalidations");
  const cachedKeysList = document.getElementById("cached-keys-list");

  // Pipeline Nodes
  const nodeRoute = document.getElementById("node-route");
  const nodeMiddleware = document.getElementById("node-middleware");
  const nodeController = document.getElementById("node-controller");
  const nodeService = document.getElementById("node-service");
  const nodeDatabase = document.getElementById("node-database");
  const flowIndicator = document.getElementById("flow-indicator");

  let activeTtlInterval = null;

  // Log activity
  function addLog(msg, type = "info") {
    const li = document.createElement("li");
    li.className = `activity-item ${type}`;
    const timeStr = new Date().toLocaleTimeString();
    li.innerHTML = `<span class="log-time">${timeStr}</span><span class="log-msg">${msg}</span>`;
    activityLog.prepend(li);
  }

  // Animate Pipeline
  function animatePipeline(type) {
    // Reset classes
    [nodeRoute, nodeMiddleware, nodeController, nodeService, nodeDatabase].forEach((n) => {
      n.classList.remove("active", "hit-shortcircuit");
    });

    if (type === "HIT") {
      flowIndicator.textContent = "Cache HIT: Short-circuiting at Middleware!";
      flowIndicator.style.color = "#34d399";
      nodeRoute.classList.add("active");
      setTimeout(() => {
        nodeMiddleware.classList.add("hit-shortcircuit");
      }, 80);
    } else if (type === "MISS") {
      flowIndicator.textContent = "Cache MISS: Full Pipeline executed!";
      flowIndicator.style.color = "#fbbf24";
      nodeRoute.classList.add("active");
      setTimeout(() => nodeMiddleware.classList.add("active"), 60);
      setTimeout(() => nodeController.classList.add("active"), 120);
      setTimeout(() => nodeService.classList.add("active"), 180);
      setTimeout(() => nodeDatabase.classList.add("active"), 240);
    } else if (type === "INVALIDATED") {
      flowIndicator.textContent = "Cache Invalidated: Data modified!";
      flowIndicator.style.color = "#f87171";
      nodeRoute.classList.add("active");
      setTimeout(() => nodeMiddleware.classList.add("active"), 60);
      setTimeout(() => nodeController.classList.add("active"), 120);
      setTimeout(() => nodeService.classList.add("active"), 180);
      setTimeout(() => nodeDatabase.classList.add("active"), 240);
    }
  }

  // Refresh Cache Stats
  async function refreshCacheStats() {
    try {
      const res = await fetch("/cache/stats");
      const data = await res.json();
      if (data.success && data.cache) {
        statHits.textContent = data.cache.hits;
        statMisses.textContent = data.cache.misses;
        statSize.textContent = data.cache.size;
        statInvalidations.textContent = data.cache.invalidations;

        if (data.cache.keys.length > 0) {
          cachedKeysList.innerHTML = data.cache.keys
            .map((k) => `<span class="key-tag">${k}</span>`)
            .join("");
        } else {
          cachedKeysList.innerHTML = '<span class="keys-empty">No active cached keys</span>';
        }
      }
    } catch (err) {
      console.error("Failed to load cache stats:", err);
    }
  }

  // Countdown timer for TTL
  function startTtlCountdown(createdAtIso) {
    if (activeTtlInterval) clearInterval(activeTtlInterval);

    const createdTime = new Date(createdAtIso).getTime();
    const ttlMs = 60 * 1000;

    function update() {
      const elapsed = Date.now() - createdTime;
      const remainingSec = Math.max(0, Math.ceil((ttlMs - elapsed) / 1000));
      headerTtlCountdown.textContent = `${remainingSec}s`;

      if (remainingSec <= 0) {
        headerTtlCountdown.textContent = "Expired";
        headerTtlCountdown.style.color = "#f87171";
        clearInterval(activeTtlInterval);
      } else {
        headerTtlCountdown.style.color = "#34d399";
      }
    }

    update();
    activeTtlInterval = setInterval(update, 1000);
  }

  // Generic Request Runner
  async function sendApiRequest(method, url, body = null) {
    consoleUrl.textContent = `${method} ${url}`;
    jsonDisplay.textContent = "Executing request...";
    const startTime = performance.now();

    try {
      const options = {
        method,
        headers: { "Content-Type": "application/json" }
      };
      if (body) {
        options.body = JSON.stringify(body);
      }

      const res = await fetch(url, options);
      const duration = Math.round(performance.now() - startTime);
      const data = await res.json();

      const xCache = res.headers.get("x-cache");
      const createdAt = res.headers.get("x-cache-created-at");
      const invalidated = res.headers.get("x-cache-invalidated");

      // Update Inspector Strip
      headerStatus.textContent = `${res.status} ${res.statusText}`;
      headerTime.textContent = `${duration}ms`;
      headerXCache.textContent = xCache || (invalidated ? "INVALIDATED" : "-");

      if (xCache === "HIT") {
        cacheBadge.className = "cache-badge badge-hit";
        cacheBadge.textContent = "CACHE HIT";
        animatePipeline("HIT");
        addLog(`[HIT] ${method} ${url} (took ${duration}ms)`, "hit");
        if (createdAt) {
          headerCreated.textContent = new Date(createdAt).toLocaleTimeString();
          startTtlCountdown(createdAt);
        }
      } else if (xCache === "MISS") {
        cacheBadge.className = "cache-badge badge-miss";
        cacheBadge.textContent = "CACHE MISS";
        animatePipeline("MISS");
        addLog(`[MISS] ${method} ${url} (took ${duration}ms) -> Cached for 1 min`, "miss");
        headerCreated.textContent = "Just now";
        startTtlCountdown(new Date().toISOString());
      } else if (invalidated) {
        cacheBadge.className = "cache-badge badge-invalidated";
        cacheBadge.textContent = "CACHE INVALIDATED";
        animatePipeline("INVALIDATED");
        addLog(`[MODIFIED] ${method} ${url} -> All cached product entries invalidated!`, "invalidated");
        headerCreated.textContent = "-";
        headerTtlCountdown.textContent = "-";
        if (activeTtlInterval) clearInterval(activeTtlInterval);
      } else {
        cacheBadge.className = "cache-badge badge-idle";
        cacheBadge.textContent = `STATUS ${res.status}`;
        headerCreated.textContent = "-";
        headerTtlCountdown.textContent = "-";
      }

      // Render JSON
      jsonDisplay.textContent = JSON.stringify(data, null, 2);

      // Refresh Stats
      refreshCacheStats();
    } catch (err) {
      jsonDisplay.textContent = `Error: ${err.message}`;
      addLog(`Error executing ${method} ${url}: ${err.message}`, "invalidated");
    }
  }

  // Event Handlers
  btnGetAll.addEventListener("click", () => {
    sendApiRequest("GET", "/products");
  });

  btnGetOne.addEventListener("click", () => {
    const id = inputProductId.value.trim() || 1;
    sendApiRequest("GET", `/products/${id}`);
  });

  btnCreateProduct.addEventListener("click", () => {
    const randomId = Math.floor(Math.random() * 1000);
    const sampleProduct = {
      name: `Ultra Pro Device #${randomId}`,
      price: Math.floor(Math.random() * 500) + 49,
      category: "Electronics",
      description: "Auto-generated gadget for testing cache invalidation",
      inStock: true
    };
    sendApiRequest("POST", "/products", sampleProduct);
  });

  btnUpdateProduct.addEventListener("click", () => {
    const id = inputUpdateId.value.trim() || 1;
    const updateData = {
      name: `Updated Pro Laptop (v${Math.floor(Math.random() * 99)})`,
      price: 1999.0,
      category: "Laptops",
      description: "Updated device specs",
      inStock: true
    };
    sendApiRequest("PUT", `/products/${id}`, updateData);
  });

  btnPatchProduct.addEventListener("click", () => {
    const id = inputPatchId.value.trim() || 2;
    const patchData = {
      price: Math.floor(Math.random() * 100) + 20
    };
    sendApiRequest("PATCH", `/products/${id}`, patchData);
  });

  btnDeleteProduct.addEventListener("click", () => {
    const id = inputDeleteId.value.trim() || 5;
    sendApiRequest("DELETE", `/products/${id}`);
  });

  btnRefreshStats.addEventListener("click", refreshCacheStats);

  btnClearLogs.addEventListener("click", () => {
    activityLog.innerHTML = "";
    addLog("Activity logs cleared.", "info");
  });

  // Initial load
  refreshCacheStats();
});
