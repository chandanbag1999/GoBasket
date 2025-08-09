require("dotenv").config();

const app = require("./src/app");
const database = require("./src/config/database");
const redisConnection = require("./src/config/redis");
const CacheManager = require("./src/utils/cacheManager");

const PORT = process.env.PORT || 5000;

// Initialize database connections before starting server
async function initializeConnections() {
  try {
    console.log("🔄 Initializing database connections...");

    // Connect to MongoDB
    await database.connect();

    // Connect to Redis
    await redisConnection.connect();

    // Initialize cache management after connections
    console.log("🔥 Initializing cache management...");
    CacheManager.init();

    console.log(
      "✅ All database connections and cache system established successfully!"
    );
    return true;
  } catch (error) {
    console.error(
      "❌ Failed to establish database connections:",
      error.message
    );
    process.exit(1);
  }
}

// Start server with database connections
const startServer = async () => {
  try {
    // Initialize all connections first
    await initializeConnections();

    // Start the server
    app.listen(PORT, () => {
      console.log("🚀 ================================");
      console.log(`🌟 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🧪 Database test: http://localhost:${PORT}/test-db`);
      console.log(
        `⚡ Cache stats: http://localhost:${PORT}/api/v1/cache/stats`
      );
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/v1/auth/*`);
      console.log("🚀 ================================");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

// Graceful shutdown handling
process.on("SIGTERM", async () => {
  console.log("🔄 SIGTERM received. Shutting down gracefully...");
  await database.disconnect();
  await redisConnection.disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🔄 SIGINT received. Shutting down gracefully...");
  await database.disconnect();
  await redisConnection.disconnect();
  process.exit(0);
});

// Start the server
startServer();


