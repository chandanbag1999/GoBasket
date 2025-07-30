const Queue = require('bull');
const redis = require('ioredis');
const logger = require('../utils/logger');

// Create Redis connection for queues
const redisConfig = process.env.REDIS_URL || {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryDelayOnFailover: 100,
};

// Initialize different queues for different purposes
const queues = {
  // Email notifications queue
  emailQueue: new Queue('email notifications', {
    redis: redisConfig,
    defaultJobOptions: {
      removeOnComplete: 10,    // Keep only 10 completed jobs
      removeOnFail: 5,         // Keep only 5 failed jobs
      attempts: 3,             // Retry failed jobs 3 times
      backoff: {
        type: 'exponential',
        delay: 2000,           // Start with 2 second delay
      },
    },
  }),

  // SMS notifications queue
  smsQueue: new Queue('sms notifications', {
    redis: redisConfig,
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 5,
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  }),

  // Order processing queue
  orderQueue: new Queue('order processing', {
    redis: redisConfig,
    defaultJobOptions: {
      removeOnComplete: 20,
      removeOnFail: 10,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    },
  }),

  // Delivery assignment queue
  deliveryQueue: new Queue('delivery assignment', {
    redis: redisConfig,
    defaultJobOptions: {
      removeOnComplete: 15,
      removeOnFail: 10,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 3000,
      },
    },
  }),

  // Analytics processing queue
  analyticsQueue: new Queue('analytics processing', {
    redis: redisConfig,
    defaultJobOptions: {
      removeOnComplete: 5,
      removeOnFail: 3,
      attempts: 2,
      delay: 5000,           // 5 second delay for analytics
    },
  }),
};

// Queue event listeners for monitoring
Object.keys(queues).forEach(queueName => {
  const queue = queues[queueName];
  
  queue.on('completed', (job, result) => {
    logger.info(`Queue job completed`, {
      queue: queueName,
      jobId: job.id,
      jobType: job.name,
      processingTime: Date.now() - job.processedOn,
      result: typeof result === 'object' ? JSON.stringify(result) : result
    });
  });

  queue.on('failed', (job, err) => {
    logger.error(`Queue job failed`, {
      queue: queueName,
      jobId: job.id,
      jobType: job.name,
      error: err.message,
      attempts: job.attemptsMade,
      failedReason: job.failedReason
    });
  });

  queue.on('stalled', (job) => {
    logger.warn(`Queue job stalled`, {
      queue: queueName,
      jobId: job.id,
      jobType: job.name
    });
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Shutting down queues gracefully...');
  
  const shutdownPromises = Object.keys(queues).map(async queueName => {
    const queue = queues[queueName];
    await queue.close();
    logger.info(`${queueName} queue closed`);
  });

  await Promise.all(shutdownPromises);
  logger.info('All queues shut down successfully');
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = {
  queues,
  gracefulShutdown
};
