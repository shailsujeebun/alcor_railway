import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

type MemoryValue = {
  value: string;
  expiresAt: number | null;
};

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private readonly memoryStore = new Map<string, MemoryValue>();
  private useMemoryFallback = false;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('redis.url')!;

    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 1000,
      retryStrategy: () => null,
      lazyConnect: true,
    });

    this.client.on('ready', () => {
      if (this.useMemoryFallback) {
        this.logger.log('Redis connection restored. Leaving fallback mode.');
      }
      this.useMemoryFallback = false;
    });

    this.client.on('error', (error) => {
      if (!this.useMemoryFallback) {
        this.logger.warn(
          `Redis unavailable at ${redisUrl}. Using in-memory fallback. (${error.message})`,
        );
      }
      this.useMemoryFallback = true;
    });

    void this.client.connect().catch(() => {
      if (!this.useMemoryFallback) {
        this.logger.warn('Redis connect failed. Using in-memory fallback.');
      }
      this.useMemoryFallback = true;
    });
  }

  async get(key: string): Promise<string | null> {
    if (this.useMemoryFallback) {
      return this.memoryGet(key);
    }
    return this.safeRedisCall(() => this.client.get(key), () =>
      this.memoryGet(key),
    );
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.useMemoryFallback) {
      this.memorySet(key, value, ttlSeconds);
      return;
    }
    await this.safeRedisCall(
      async () => {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
      },
      () => this.memorySet(key, value, ttlSeconds),
    );
  }

  async incr(key: string): Promise<number> {
    if (this.useMemoryFallback) {
      return this.memoryIncr(key);
    }
    return this.safeRedisCall(() => this.client.incr(key), () =>
      this.memoryIncr(key),
    );
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    if (this.useMemoryFallback) {
      this.memoryExpire(key, ttlSeconds);
      return;
    }
    await this.safeRedisCall(
      () => this.client.expire(key, ttlSeconds),
      () => {
        this.memoryExpire(key, ttlSeconds);
        return 1;
      },
    );
  }

  async ttl(key: string): Promise<number> {
    if (this.useMemoryFallback) {
      return this.memoryTtl(key);
    }
    return this.safeRedisCall(() => this.client.ttl(key), () =>
      this.memoryTtl(key),
    );
  }

  async del(key: string): Promise<void> {
    if (this.useMemoryFallback) {
      this.memoryStore.delete(key);
      return;
    }
    await this.safeRedisCall(
      () => this.client.del(key),
      () => {
        this.memoryStore.delete(key);
        return 1;
      },
    );
  }

  async onModuleDestroy() {
    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }

  private async safeRedisCall<T>(
    redisAction: () => Promise<T>,
    fallbackAction: () => T,
  ): Promise<T> {
    try {
      return await redisAction();
    } catch (error) {
      if (!this.useMemoryFallback) {
        const message =
          error instanceof Error ? error.message : 'unknown Redis error';
        this.logger.warn(
          `Redis command failed (${message}). Using in-memory fallback.`,
        );
      }
      this.useMemoryFallback = true;
      return fallbackAction();
    }
  }

  private memoryGet(key: string): string | null {
    const entry = this.memoryStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      this.memoryStore.delete(key);
      return null;
    }
    return entry.value;
  }

  private memorySet(key: string, value: string, ttlSeconds?: number) {
    this.memoryStore.set(key, {
      value,
      expiresAt:
        typeof ttlSeconds === 'number' ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  private memoryIncr(key: string): number {
    const currentValue = this.memoryGet(key);
    const parsed = parseInt(currentValue ?? '0', 10);
    const next = (Number.isFinite(parsed) ? parsed : 0) + 1;
    const existing = this.memoryStore.get(key);
    this.memoryStore.set(key, {
      value: String(next),
      expiresAt: existing?.expiresAt ?? null,
    });
    return next;
  }

  private memoryExpire(key: string, ttlSeconds: number) {
    const existing = this.memoryStore.get(key);
    if (!existing) return;
    this.memoryStore.set(key, {
      value: existing.value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  private memoryTtl(key: string): number {
    const entry = this.memoryStore.get(key);
    if (!entry) return -2;
    if (entry.expiresAt === null) return -1;
    const ttl = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    if (ttl <= 0) {
      this.memoryStore.delete(key);
      return -2;
    }
    return ttl;
  }
}
