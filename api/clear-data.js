// Clear all feedback data from Redis
import { Redis } from '@upstash/redis';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST to clear data.' });
  }
  
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    
    // Delete the feedback data
    await redis.del('feedback:all');
    
    return res.status(200).json({ 
      success: true, 
      message: 'All feedback data cleared from Redis' 
    });
  } catch (err) {
    return res.status(500).json({ 
      error: 'Failed to clear data', 
      message: err.message 
    });
  }
}
