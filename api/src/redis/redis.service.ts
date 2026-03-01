import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private loggedConnectionError = false;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('redis.url')!;

    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => Math.min(times * 500, 5000),
    });

    this.client.on('ready', () => {
      if (this.loggedConnectionError) {
        this.logger.log('Redis connection restored');
      }
      this.loggedConnectionError = false;
    });

    this.client.on('error', (error) => {
      if (this.loggedConnectionError) {
        return;
      }

      this.loggedConnectionError = true;
      this.logger.warn(
        `Redis unavailable at ${redisUrl}. Continuing without cache until it recovers. (${error.message})`,
      );
    });
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async onModuleDestroy() {
    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }
}
