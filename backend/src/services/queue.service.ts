/**
 * Request queue service to handle rate limiting gracefully
 * Queues incoming requests and processes them sequentially with delays
 */

interface QueuedRequest {
  id: string;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  handler: () => Promise<any>;
  timestamp: number;
}

export class QueueService {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private minDelayMs = 500; // Minimum delay between requests to Claude
  private lastRequestTime = 0;

  /**
   * Add a request to the queue
   */
  async enqueue<T>(handler: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        id: Date.now().toString(),
        resolve,
        reject,
        handler,
        timestamp: Date.now(),
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queued requests sequentially
   */
  private async processQueue() {
    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (!request) break;

      try {
        // Ensure minimum delay between requests
        const timeSinceLastRequest = Date.now() - this.lastRequestTime;
        if (timeSinceLastRequest < this.minDelayMs) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.minDelayMs - timeSinceLastRequest)
          );
        }

        this.lastRequestTime = Date.now();
        const result = await request.handler();
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }
    }

    this.processing = false;
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }
}

export const queueService = new QueueService();
