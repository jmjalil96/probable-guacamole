import { Redis } from "ioredis";
import { env } from "../../config/env.js";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

const SENT_TTL = 60 * 60 * 24; // 24 hours

export const isEmailSent = async (jobId: string): Promise<boolean> => {
  const key = `email:sent:${jobId}`;
  const exists = await redis.exists(key);
  return exists === 1;
};

export const markEmailSent = async (jobId: string): Promise<void> => {
  const key = `email:sent:${jobId}`;
  await redis.set(key, "1", "EX", SENT_TTL);
};
