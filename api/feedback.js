// Vercel Serverless Function for feedback API with Vercel KV storage
// Falls back to in-memory storage if KV is not configured

let kvAvailable = false;
let kv = null;

// Try to import KV, but handle if not configured
try {
  const kvModule = await import('@vercel/kv');
  kv = kvModule.kv;
  kvAvailable = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
} catch (err) {
  console.log('KV not available, using fallback storage');
}

const FEEDBACK_KEY = 'feedback:all';

// In-memory fallback storage (resets on deployment)
let memoryStore = null;

// Initialize with sample data if empty
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

async function initializeData() {
  if (kvAvailable) {
    try {
      const existing = await kv.get(FEEDBACK_KEY);
      if (!existing || existing.length === 0) {
        const feedbackStore = initialData.map((text, index) => ({
          id: index + 1,
          text,
          sentiment: null,
          confidence: null,
          created_at: new Date().toISOString()
        }));
        await kv.set(FEEDBACK_KEY, feedbackStore);
        return feedbackStore;
      }
      return existing;
    } catch (err) {
      console.error('KV error, using fallback:', err);
      kvAvailable = false;
    }
  }
  
  // Fallback to in-memory storage
  if (!memoryStore) {
    memoryStore = initialData.map((text, index) => ({
      id: index + 1,
      text,
      sentiment: null,
      confidence: null,
      created_at: new Date().toISOString()
    }));
  }
  return memoryStore;
}

async function getFeedback() {
  if (kvAvailable) {
    try {
      return await kv.get(FEEDBACK_KEY) || [];
    } catch (err) {
      kvAvailable = false;
    }
  }
  return memoryStore || [];
}

async function setFeedback(data) {
  if (kvAvailable) {
    try {
      await kv.set(FEEDBACK_KEY, data);
      return;
    } catch (err) {
      kvAvailable = false;
    }
  }
  memoryStore = data;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // GET all feedback
    if (req.method === 'GET') {
      const feedbackStore = await initializeData();
      return res.status(200).json({ data: feedbackStore });
    }

    // POST new feedback
    if (req.method === 'POST') {
      const { text, sentiment, confidence } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Feedback text is required' });
      }

      let feedbackStore = await getFeedback();
      
      const newFeedback = {
        id: feedbackStore.length > 0 ? Math.max(...feedbackStore.map(f => f.id)) + 1 : 1,
        text,
        sentiment: sentiment || null,
        confidence: confidence || null,
        created_at: new Date().toISOString()
      };

      feedbackStore.push(newFeedback);
      await setFeedback(feedbackStore);
      
      return res.status(201).json(newFeedback);
    }

    // DELETE feedback by ID (from query param)
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }

      let feedbackStore = await getFeedback();
      const index = feedbackStore.findIndex(item => item.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json({ error: 'Feedback not found' });
      }

      feedbackStore.splice(index, 1);
      await setFeedback(feedbackStore);
      
      return res.status(200).json({ deleted: 1 });
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
