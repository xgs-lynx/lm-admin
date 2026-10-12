/**
 * 说明：原实现基于 egg-redis(ioredis)。这里使用 ioredis 客户端，
 * 保持与原实现完全一致的 key 前缀规则（哈希/集合操作使用 Like: 前缀）。
 */
import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import config from '../common/config';

const time = 60 * 60 * 24 * 30; // 30天
const { redisPrefix } = config;

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      db: parseInt(process.env.REDIS_DB || '0', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      lazyConnect: false,
    });
    this.redis.on('error', err => {
      this.logger.error(`redis error: ${err.message}`);
    });
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }

  /** 原样返回 ioredis 实例，用于少量需要原始命令的场景（smembers/sadd） */
  get client(): Redis {
    return this.redis;
  }

  async set(key: string, value: any, seconds?: number): Promise<void> {
    if (!this.redis) return;
    await this.redis.set(key, JSON.stringify(value), 'EX', seconds || time);
  }

  async get(key: string): Promise<any> {
    if (!this.redis) return;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : false;
  }

  async del(...keys: any[]): Promise<number> {
    const args = keys.flat();
    return this.redis.del(...args);
  }

  async flushall(): Promise<void> {
    return this.redis.flushall() as any;
  }

  async sSet(key: string, values: any): Promise<number> {
    const args = Array.isArray(values) ? values : [values];
    return this.redis.sadd(redisPrefix + key, ...args);
  }

  async sGet(key: string): Promise<string[]> {
    return this.redis.smembers(redisPrefix + key);
  }

  async hGet(key: string, field: string): Promise<any> {
    const data = await this.redis.hget(redisPrefix + key, field);
    return data || false;
  }

  async hSet(key: string, field: string, value: any, timeSec?: number): Promise<any> {
    const res = await this.redis.hset(redisPrefix + key, field, value);
    if (timeSec > 0) {
      const ok = await this.redis.expire(redisPrefix + key, timeSec);
      return ok ? res : false;
    }
    return res;
  }

  async hDel(key: string, field: string): Promise<number> {
    return this.redis.hdel(redisPrefix + key, field);
  }

  async hExists(key: string, field: string): Promise<boolean> {
    return (await this.redis.hexists(redisPrefix + key, field)) === 1;
  }

  async exists(key: string): Promise<number> {
    return this.redis.exists(key);
  }

  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }

  async expire(key: string, timeSec: number): Promise<number> {
    return this.redis.expire(key, timeSec);
  }

  async info(sections?: string): Promise<Record<string, string>> {
    const data = sections ? await this.redis.info(sections) : await this.redis.info();
    const result: Record<string, string> = {};
    const lines = data.split('\r\n');
    for (const line of lines) {
      if (line === '' || line.startsWith('# ')) continue;
      const idx = line.indexOf(':');
      if (idx === -1) continue;
      const key = line.slice(0, idx);
      const val = line.slice(idx + 1);
      result[key] = val;
    }
    return result;
  }

  async dbSize(): Promise<number> {
    return this.redis.dbsize();
  }
}
