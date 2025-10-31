import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// ключ бесіди завжди у відсортованому порядку
export function convoKey(a, b) {
  return `convo:${[a, b].sort().join(":")}`;
}
