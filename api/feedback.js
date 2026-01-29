// Vercel Serverless Function for feedback API
// Uses Upstash Redis for persistent storage (with in-memory fallback)

import { Redis } from '@upstash/redis';

let redisClient = null;
let feedbackStore = null;

// Initialize with sample data
const initialData = [
  'Great product, very satisfied!',
  'The checkout process was confusing.',
  'Loved the fast shipping 🚚',
  'Customer support was unhelpful.',
  'Amazing quality, will buy again.',
  'Too expensive for the value.',
  'Easy to use website.',
  'Received a damaged item.',
  'The colors are vibrant and true to photos.',
  'Wish there were more size options.'
];

// Try to import Redis client
function initRedis() {
  if (redisClient) return;
  
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      console.log('Redis client initialized');
    } else {
      console.log('Redis env vars not found, using fallback storage');
    }
  } catch (err) {
    console.log('Redis initialization error, using fallback storage:', err.message);
  }
}

function initializeData() {
  if (!feedbackStore) {
    feedbackStore = initialData.map((text, index) => ({
      id: index + 1,
      text,
      sentiment: null,
      confidence: null,
      created_at: new Date().toISOString()
    }));
  }
  return feedbackStore;
}

async function getFeedbackFromRedis() {
  if (!redisClient) return null;
  
  try {
    const data = await redisClient.get('feedback:all');
    return data;
  } catch (err) {
    console.error('Redis error:', err);
    return null;
  }
}

async function setFeedbackToRedis(data) {
  if (!redisClient) return false;
  
  try {
    await redisClient.set('feedback:all', data);
    return true;
  } catch (err) {
    console.error('Redis error:', err);
    return false;
  }
}

export default async function handler(req, res) {
  initRedis();
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  res.setHeader('Content-Type', 'application/json');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // GET all feedback
    if (req.method === 'GET') {
      let data;
      
      // Try Redis first
      if (redisClient) {
        data = await getFeedbackFromRedis();
      }
      
      // Fallback to in-memory
      if (!data) {
        data = initializeData();
      }
      
      return res.status(200).json({ data });
    }

    // POST new feedback
    if (req.method === 'POST') {
      const { text, sentiment, confidence } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Feedback text is required' });
      }

      let feedbackData;
      
      // Try to get from Redis
      if (redisClient) {
        feedbackData = await getFeedbackFromRedis();
      }
      
      // Fallback to in-memory
      if (!feedbackData) {
        feedbackData = initializeData();
      }

      const newFeedback = {
        id: feedbackData.length > 0 ? Math.max(...feedbackData.map(f => f.id)) + 1 : 1,
        text,
        sentiment: sentiment || null,
        confidence: confidence || null,
        created_at: new Date().toISOString()
      };

      feedbackData.push(newFeedback);
      feedbackStore = feedbackData; // Update in-memory
      
      // Try to save to Redis
      if (redisClient) {
        await setFeedbackToRedis(feedbackData);
      }
      
      return res.status(201).json(newFeedback);
    }

    // DELETE feedback by ID
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }

      let feedbackData;
      
      // Try to get from Redis
      if (redisClient) {
        feedbackData = await getFeedbackFromRedis();
      }
      
      // Fallback to in-memory
      if (!feedbackData) {
        feedbackData = initializeData();
      }

      const index = feedbackData.findIndex(item => item.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json({ error: 'Feedback not found' });
      }

      feedbackData.splice(index, 1);
      feedbackStore = feedbackData; // Update in-memory
      
      // Try to save to Redis
      if (redisClient) {
        await setFeedbackToRedis(feedbackData);
      }
      
      return res.status(200).json({ deleted: 1 });
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
