// Vercel Serverless Function for feedback API
// Uses in-memory storage (works without database setup)
// Data persists during deployment but resets on new deployments

// In-memory storage
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

export default function handler(req, res) {
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
      const data = initializeData();
      return res.status(200).json({ data });
    }

    // POST new feedback
    if (req.method === 'POST') {
      const { text, sentiment, confidence } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Feedback text is required' });
      }

      initializeData();
      
      const newFeedback = {
        id: feedbackStore.length > 0 ? Math.max(...feedbackStore.map(f => f.id)) + 1 : 1,
        text,
        sentiment: sentiment || null,
        confidence: confidence || null,
        created_at: new Date().toISOString()
      };

      feedbackStore.push(newFeedback);
      
      return res.status(201).json(newFeedback);
    }

    // DELETE feedback by ID (from query param)
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }

      initializeData();
      const index = feedbackStore.findIndex(item => item.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json({ error: 'Feedback not found' });
      }

      feedbackStore.splice(index, 1);
      
      return res.status(200).json({ deleted: 1 });
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
