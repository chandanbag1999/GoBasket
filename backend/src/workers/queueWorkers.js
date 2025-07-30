const { queues } = require('../config/queue');
const emailProcessor = require('../processors/emailProcessor');
const smsProcessor = require('../processors/smsProcessor');
const orderProcessor = require('../processors/orderProcessor');
const deliveryProcessor = require('../processors/deliveryProcessor');
const logger = require('../utils/logger');

class QueueWorkers {
  constructor() {
    this.queues = [];
    this.isStarted = false;
  }

  startAllWorkers() {
    if (this.isStarted) {
      logger.warn('Queue workers already started');
      return;
    }

    logger.info('Starting all queue workers...');

    // Email queue worker
    queues.emailQueue.process('send_email', 5, emailProcessor);
    this.queues.push({ name: 'email', queue: queues.emailQueue });

    // SMS queue worker
    queues.smsQueue.process('send_sms', 3, smsProcessor);
    this.queues.push({ name: 'sms', queue: queues.smsQueue });

    // Order processing worker
    queues.orderQueue.process(2, orderProcessor);
    this.queues.push({ name: 'order', queue: queues.orderQueue });

    // Delivery assignment worker
    queues.deliveryQueue.process(3, deliveryProcessor);
    this.queues.push({ name: 'delivery', queue: queues.deliveryQueue });

    // Analytics worker (lower priority)
    queues.analyticsQueue.process('analytics', 1, async (job) => {
      logger.info('Processing analytics job', {
        jobId: job.id,
        data: job.data
      });

      // Analytics processing logic would go here
      return { processed: true };
    });
    this.queues.push({ name: 'analytics', queue: queues.analyticsQueue });

    logger.info(`Started ${this.queues.length} queue workers`);

    // Setup worker event listeners
    this.setupWorkerEventListeners();
    this.isStarted = true;
  }

  setupWorkerEventListeners() {
    this.queues.forEach(({ name, queue }) => {
      // Worker-specific events (these are already set up in queue.js, but we can add more specific logging)
      queue.on('completed', (job, result) => {
        logger.info(`${name} worker completed job`, {
          jobId: job.id,
          processingTime: job.processedOn ? Date.now() - job.processedOn : 'unknown',
          result: typeof result === 'object' ? JSON.stringify(result) : result
        });
      });

      queue.on('failed', (job, err) => {
        logger.error(`${name} worker failed job`, {
          jobId: job.id,
          error: err.message,
          attempts: job.attemptsMade,
          data: job.data
        });
      });

      queue.on('stalled', (job) => {
        logger.warn(`${name} worker stalled`, {
          jobId: job.id,
          data: job.data
        });
      });

      // Additional worker events
      queue.on('progress', (job, progress) => {
        logger.debug(`${name} worker progress`, {
          jobId: job.id,
          progress: progress
        });
      });
    });
  }

  async stopAllWorkers() {
    if (!this.isStarted) {
      logger.warn('Queue workers not started');
      return;
    }

    logger.info('Stopping all queue workers...');

    const stopPromises = this.queues.map(async ({ name, queue }) => {
      try {
        await queue.close();
        logger.info(`${name} queue closed`);
      } catch (error) {
        logger.error(`Error closing ${name} queue:`, error);
      }
    });

    await Promise.all(stopPromises);
    this.queues = [];
    this.isStarted = false;
    logger.info('All queue workers stopped');
  }

  // Method to add jobs to queues
  static async addEmailJob(type, data, options = {}) {
    return await queues.emailQueue.add('send_email', { type, data }, options);
  }

  static async addSMSJob(type, data, options = {}) {
    return await queues.smsQueue.add('send_sms', { type, data }, options);
  }

  static async addOrderJob(type, data, options = {}) {
    return await queues.orderQueue.add(type, data, options);
  }

  static async addDeliveryJob(type, data, options = {}) {
    return await queues.deliveryQueue.add(type, data, options);
  }

  static async addAnalyticsJob(type, data, options = {}) {
    return await queues.analyticsQueue.add('analytics', { type, data }, options);
  }

  // Get queue statistics
  static async getQueueStats() {
    const stats = {};

    for (const [queueName, queue] of Object.entries(queues)) {
      const waiting = await queue.getWaiting();
      const active = await queue.getActive();
      const completed = await queue.getCompleted();
      const failed = await queue.getFailed();

      stats[queueName] = {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length
      };
    }

    return stats;
  }
}

module.exports = QueueWorkers;
