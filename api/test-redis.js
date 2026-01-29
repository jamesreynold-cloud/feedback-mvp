// Test Redis connection
import { Redis } from '@upstash/redis';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  const hasUrl = !!process.env.UPSTASH_REDIS_REST_URL;
  const hasToken = !!process.env.UPSTASH_REDIS_REST_TOKEN;
  
  let redisTest = 'Not attempted';
  
  if (hasUrl && hasToken) {
    try {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      
      // Try to set and get a test value
      await redis.set('test:connection', 'working');
      const result = await redis.get('test:connection');
      
      redisTest = result === 'working' ? 'SUCCESS' : 'FAILED';
    } catch (err) {
      redisTest = `ERROR: ${err.message}`;
    }
  }
  
  return res.status(200).json({
    hasRedisUrl: hasUrl,
    hasRedisToken: hasToken,
    redisTest,
    urlPreview: hasUrl ? process.env.UPSTASH_REDIS_REST_URL.substring(0, 30) + '...' : 'missing'
  });
}
