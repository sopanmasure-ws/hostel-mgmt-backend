const Redis = require('ioredis');

class CacheService {
  constructor() {
    this.isRedisAvailable = false;
    this.memoryCache = new Map();
    this.defaultTTL = 300; // 5 minutes in seconds

    // Try to connect to Redis
    if (process.env.NODE_ENV !== 'test') {
      try {
        this.redisClient = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
          retryStrategy: (times) => {
            if (times > 3) {
              console.log('⚠ Redis unavailable, using memory cache');
              return null;
            }
            return Math.min(times * 50, 2000);
          },
        });

        this.redisClient.on('connect', () => {
          this.isRedisAvailable = true;
          console.log('✓ Redis connected for caching');
        });

        this.redisClient.on('error', (err) => {
          this.isRedisAvailable = false;
          console.log('⚠ Redis error, falling back to memory cache:', err.message);
        });
      } catch (error) {
        console.log('⚠ Redis initialization failed, using memory cache');
        this.isRedisAvailable = false;
      }
    }
  }

  /**
   * Get value from cache
   */
  async get(key) {
    try {
      if (this.isRedisAvailable && this.redisClient) {
        const value = await this.redisClient.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        // Use memory cache
        const cached = this.memoryCache.get(key);
        if (cached && cached.expires > Date.now()) {
          return cached.value;
        }
        this.memoryCache.delete(key);
        return null;
      }
    } catch (error) {
      console.error('Cache get error:', error.message);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (this.isRedisAvailable && this.redisClient) {
        await this.redisClient.setex(key, ttl, JSON.stringify(value));
      } else {
        // Use memory cache
        this.memoryCache.set(key, {
          value,
          expires: Date.now() + (ttl * 1000),
        });
        
        // Clean up expired entries periodically
        if (this.memoryCache.size > 1000) {
          this.cleanupMemoryCache();
        }
      }
    } catch (error) {
      console.error('Cache set error:', error.message);
    }
  }

  /**
   * Delete value from cache
   */
  async del(key) {
    try {
      if (this.isRedisAvailable && this.redisClient) {
        await this.redisClient.del(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      console.error('Cache delete error:', error.message);
    }
  }

  /**
   * Delete all keys matching pattern
   */
  async delPattern(pattern) {
    try {
      if (this.isRedisAvailable && this.redisClient) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      } else {
        // Delete matching keys from memory cache
        for (const key of this.memoryCache.keys()) {
          if (key.includes(pattern.replace('*', ''))) {
            this.memoryCache.delete(key);
          }
        }
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error.message);
    }
  }

  /**
   * Clear all cache
   */
  async clear() {
    try {
      if (this.isRedisAvailable && this.redisClient) {
        await this.redisClient.flushall();
      } else {
        this.memoryCache.clear();
      }
    } catch (error) {
      console.error('Cache clear error:', error.message);
    }
  }

  /**
   * Cleanup expired entries from memory cache
   */
  cleanupMemoryCache() {
    const now = Date.now();
    for (const [key, value] of this.memoryCache.entries()) {
      if (value.expires <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      type: this.isRedisAvailable ? 'Redis' : 'Memory',
      size: this.memoryCache.size,
      isRedisAvailable: this.isRedisAvailable,
    };
  }
}

// Export singleton instance
const cacheService = new CacheService();

/**
 * Cache middleware factory
 */
const cacheMiddleware = (keyPrefix, ttl = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const cacheKey = `${keyPrefix}:${req.originalUrl}:${JSON.stringify(req.query)}`;

    try {
      // Try to get from cache
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        return res.status(200).json({
          ...cachedData,
          cached: true,
          cacheKey,
        });
      }

      // Store original res.json
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = function(data) {
        // Only cache successful responses
        if (data.success !== false) {
          cacheService.set(cacheKey, data, ttl).catch(err => 
            console.error('Error caching response:', err)
          );
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

module.exports = {
  cacheService,
  cacheMiddleware,
};
