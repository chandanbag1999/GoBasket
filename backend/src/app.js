const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

// Import database connections
const database = require("./config/database");
const redisConnection = require("./config/redis");

// Import cache service
const cacheService = require("./services/cacheService");
const CacheManager = require("./utils/cacheManager");

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const adminRoutes = require("./routes/adminRoutes");
const promotionRoutes = require("./routes/promotionRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");

const app = express();

// Trust proxy for production deployments
app.set("trust proxy", 1);

// Security middleware (must be first)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// CORS configuration (must be early)
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        process.env.CLIENT_URL || "http://localhost:3000",
        "http://localhost:3000",
        "http://localhost:3001",
        "https://your-production-domain.com",
      ];

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Cache-Control",
      "X-File-Name",
    ],
    exposedHeaders: ["X-Total-Count", "X-Cache-Status"],
    maxAge: 86400, // 24 hours
  })
);

// Request parsing middleware
app.use(
  express.json({
    limit: "10mb",
    strict: true,
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
    parameterLimit: 50,
  })
);

// Cookie parser
app.use(cookieParser());

// Logging middleware with different formats
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      skip: (req, res) => res.statusCode < 400,
    })
  );
}

// Request ID middleware for tracking
app.use((req, res, next) => {
  req.requestId = Math.random().toString(36).substring(2, 15);
  res.setHeader("X-Request-ID", req.requestId);
  next();
});

// Cache headers middleware
app.use((req, res, next) => {
  // Add cache status header
  const originalJson = res.json;
  res.json = function (data) {
    if (data && data.data && data.data.cached) {
      res.setHeader("X-Cache-Status", "HIT");
    } else {
      res.setHeader("X-Cache-Status", "MISS");
    }
    return originalJson.call(this, data);
  };
  next();
});

// Health check route with comprehensive status
app.get("/health", async (req, res) => {
  try {
    const dbStatus = database.getConnectionStatus();
    const redisStatus = redisConnection.getConnectionStatus();

    // Get cache statistics
    let cacheStats = null;
    try {
      cacheStats = await cacheService.getCacheStats();
    } catch (error) {
      console.warn("Cache stats unavailable:", error.message);
    }

    const healthStatus = {
      status: "success",
      message: "Grocery App API is running successfully! 🚀",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
      requestId: req.requestId,
      services: {
        mongodb: {
          connected: dbStatus.isConnected,
          host: dbStatus.host,
          database: dbStatus.name,
          readyState: dbStatus.readyState,
          status: dbStatus.isConnected ? "healthy" : "unhealthy",
        },
        redis: {
          connected: redisStatus.isConnected,
          ready: redisStatus.isReady,
          reconnectAttempts: redisStatus.reconnectAttempts,
          status: redisStatus.isConnected ? "healthy" : "unhealthy",
        },
        cache: {
          enabled: cacheStats !== null,
          status: cacheStats ? "healthy" : "unavailable",
          stats: cacheStats,
        },
      },
      version: process.env.npm_package_version || "1.0.0",
    };

    // Set status code based on service health
    const allHealthy = dbStatus.isConnected && redisStatus.isConnected;
    res.status(allHealthy ? 200 : 503).json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Health check failed",
      error: error.message,
      requestId: req.requestId,
    });
  }
});

// Database connectivity test route
app.get("/test-db", async (req, res) => {
  try {
    const redisPing = await redisConnection.ping();

    res.json({
      status: "success",
      message: "Database connections tested successfully",
      requestId: req.requestId,
      mongodb: database.getConnectionStatus(),
      redis: {
        ...redisConnection.getConnectionStatus(),
        ping: redisPing,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Database test failed",
      error: error.message,
      requestId: req.requestId,
    });
  }
});

// Cache management endpoints
app.get("/api/v1/cache/stats", async (req, res) => {
  try {
    const stats = await cacheService.getCacheStats();
    const performanceReport = await CacheManager.getCachePerformanceReport();

    res.status(200).json({
      status: "success",
      data: {
        stats,
        performance: performanceReport,
        timestamp: new Date().toISOString(),
      },
      requestId: req.requestId,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to get cache stats",
      error: error.message,
      requestId: req.requestId,
    });
  }
});

// Cache management endpoint (admin only)
app.post(
  "/api/v1/cache/clear",
  require("./middleware/auth").authenticate,
  require("./middleware/auth").authorize("admin"),
  async (req, res) => {
    try {
      const { pattern } = req.body;

      let result;
      if (pattern) {
        result = await CacheManager.clearCacheByPattern(pattern);
      } else {
        result = await CacheManager.clearAllCache();
      }

      res.status(200).json({
        status: "success",
        message: result ? "Cache cleared successfully" : "Cache clear failed",
        data: {
          pattern: pattern || "all",
          timestamp: new Date().toISOString(),
        },
        requestId: req.requestId,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Failed to clear cache",
        error: error.message,
        requestId: req.requestId,
      });
    }
  }
);

// Cache warming endpoint (admin only)
app.post(
  "/api/v1/cache/warmup",
  require("./middleware/auth").authenticate,
  require("./middleware/auth").authorize("admin"),
  async (req, res) => {
    try {
      await CacheManager.warmupCache();

      res.status(200).json({
        status: "success",
        message: "Cache warmup completed successfully",
        data: {
          timestamp: new Date().toISOString(),
        },
        requestId: req.requestId,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Cache warmup failed",
        error: error.message,
        requestId: req.requestId,
      });
    }
  }
);

// API routes (order matters based on specificity)
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/promotions", promotionRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/inventory", inventoryRoutes);

// API documentation endpoint
app.get("/api/v1", (req, res) => {
  res.json({
    status: "success",
    message: "Grocery App API v1.0",
    documentation: "https://api-docs.your-domain.com",
    endpoints: {
      auth: "/api/v1/auth",
      users: "/api/v1/users",
      products: "/api/v1/products",
      categories: "/api/v1/categories",
      cart: "/api/v1/cart",
      orders: "/api/v1/orders",
      payments: "/api/v1/payments",
      reviews: "/api/v1/reviews",
      wishlist: "/api/v1/wishlist",
      promotions: "/api/v1/promotions",
      admin: "/api/v1/admin",
      inventory: "/api/v1/inventory",
      notifications: "/api/v1/notifications",
    },
    cache: {
      stats: "/api/v1/cache/stats",
      clear: "/api/v1/cache/clear",
      warmup: "/api/v1/cache/warmup",
    },
    health: "/health",
    testDb: "/test-db",
    requestId: req.requestId,
  });
});

// ✅ FIXED: 404 handler for API routes with Express 5 compatible syntax
app.use("/api/v1/*splat", (req, res) => {
  res.status(404).json({
    status: "error",
    message: `API endpoint ${req.originalUrl} not found`,
    code: "ENDPOINT_NOT_FOUND",
    availableEndpoints: [
      "/api/v1/auth",
      "/api/v1/users",
      "/api/v1/products",
      "/api/v1/categories",
      "/api/v1/cart",
      "/api/v1/orders",
      "/api/v1/payments",
      "/api/v1/reviews",
      "/api/v1/wishlist",
      "/api/v1/promotions",
      "/api/v1/admin",
      "/api/v1/inventory",
      "/api/v1/notifications",
    ],
    requestId: req.requestId,
  });
});

// ✅ FIXED: Global 404 handler with Express 5 compatible syntax
app.use("/*splat", (req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found`,
    code: "ROUTE_NOT_FOUND",
    suggestion: "Check the API documentation for available endpoints",
    requestId: req.requestId,
  });
});

// Global error handler with enhanced logging
app.use((err, req, res, next) => {
  // Log error with request context
  console.error(`Error [${req.requestId}]:`, {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Handle specific error types
  if (err.name === "ValidationError") {
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: Object.values(err.errors).map((e) => e.message),
      requestId: req.requestId,
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      status: "error",
      message: "Invalid ID format",
      requestId: req.requestId,
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      status: "error",
      message: "Duplicate field value",
      requestId: req.requestId,
    });
  }

  // Default error response
  if (process.env.NODE_ENV === "development") {
    res.status(err.status || 500).json({
      status: "error",
      message: err.message,
      stack: err.stack,
      requestId: req.requestId,
    });
  } else {
    res.status(err.status || 500).json({
      status: "error",
      message: err.status < 500 ? err.message : "Something went wrong!",
      requestId: req.requestId,
    });
  }
});

// Request timeout handler
app.use((req, res, next) => {
  res.timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        status: "error",
        message: "Request timeout",
        requestId: req.requestId,
      });
    }
  }, 30000); // 30 seconds timeout

  next();
});

module.exports = app;
