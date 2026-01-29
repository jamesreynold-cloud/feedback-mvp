// Loads feedback from database API
async function fetchFeedback() {
  const apiUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api/feedback'
    : '/api/feedback';
  
  console.log('Fetching from:', apiUrl);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Fetched data:', data);
    return data.data; // Returns array of feedback objects
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

function analyzeSentiment(text) {
  const positiveWords = [
    'great', 'satisfied', 'loved', 'amazing', 'fast', 'easy', 'vibrant', 'true', 'helpful', 'quality', 'good', 'best', 'happy', 'recommend', 'excellent', 'awesome', 'love', 'perfect', 'fantastic', 'enjoy', 'like', 'buy again'
  ];
  const negativeWords = [
    'confusing', 'unhelpful', 'damaged', 'expensive', 'bad', 'worst', 'difficult', 'problem', 'issue', 'broken', 'slow', 'hate', 'dislike', 'poor', 'hard', 'complain', 'refund', 'return', 'missing', 'late', 'wrong', 'never again'
  ];
  let score = 0;
  let posMatches = 0, negMatches = 0;
  const words = text.toLowerCase().split(/\s+/);
  words.forEach(word => {
    if (positiveWords.includes(word)) {
      score++;
      posMatches++;
    }
    if (negativeWords.includes(word)) {
      score--;
      negMatches++;
    }
  });
  let sentiment = 'neutral';
  if (score > 0) sentiment = 'positive';
  else if (score < 0) sentiment = 'negative';
  return sentiment;
}

function extractThemes(feedbackArr) {
  // Simple keyword-based theme extraction
  const themes = {
    'Shipping': ['shipping', 'late', 'fast'],
    'Support': ['support', 'helpful', 'unhelpful'],
    'Price': ['expensive', 'value', 'cheap'],
    'Quality': ['quality', 'damaged', 'broken', 'vibrant'],
    'Website': ['website', 'checkout', 'easy', 'confusing'],
    'Options': ['size', 'options']
  };
  const themeCounts = {};
  Object.keys(themes).forEach(theme => themeCounts[theme] = 0);
  feedbackArr.forEach(text => {
    for (const [theme, keywords] of Object.entries(themes)) {
      if (keywords.some(k => text.toLowerCase().includes(k))) {
        themeCounts[theme]++;
      }
    }
  });
  return themeCounts;
}

function renderDashboard(feedbackArr) {
  const sentiments = { positive: 0, negative: 0, neutral: 0 };
  
  // feedbackArr contains text strings
  feedbackArr.forEach(text => {
    const sentiment = analyzeSentiment(text);
    sentiments[sentiment]++;
  });
  
  const total = feedbackArr.length || 1;
  document.getElementById('sentiment-breakdown').innerHTML =
    `<b>Positive:</b> ${sentiments.positive} (${((sentiments.positive/total)*100).toFixed(1)}%)<br>` +
    `<b>Negative:</b> ${sentiments.negative} (${((sentiments.negative/total)*100).toFixed(1)}%)<br>` +
    `<b>Neutral:</b> ${sentiments.neutral} (${((sentiments.neutral/total)*100).toFixed(1)}%)`;

  const themes = extractThemes(feedbackArr);
  document.getElementById('theme-list').innerHTML =
    Object.entries(themes).map(([theme, count]) =>
      `<li><b>${theme}:</b> ${count}</li>`
    ).join('');

  document.getElementById('feedback-list').innerHTML =
    feedbackArr.length > 0 
      ? feedbackArr.map(text => `<li>${text}</li>`).join('')
      : '<li>No feedback available</li>';
}

window.addEventListener('DOMContentLoaded', async () => {
  console.log('Dashboard loaded, fetching feedback...');
  
  try {
    const feedbackData = await fetchFeedback();
    console.log('Got feedback data:', feedbackData);
    
    if (!feedbackData || feedbackData.length === 0) {
      document.getElementById('sentiment-breakdown').innerHTML = 'No feedback data available. <a href="ingest.html">Upload feedback</a>';
      document.getElementById('theme-list').innerHTML = '';
      document.getElementById('feedback-list').innerHTML = '';
      return;
    }
    const feedbackArr = feedbackData.map(item => item.text);
    console.log('Processing feedback:', feedbackArr);
    renderDashboard(feedbackArr);
    console.log('Dashboard rendered successfully');
  } catch (err) {
    console.error('Error loading feedback:', err);
    const errorMsg = `Error: ${err.message}`;
    document.getElementById('sentiment-breakdown').textContent = errorMsg;
    document.getElementById('theme-list').textContent = '';
    document.getElementById('feedback-list').textContent = '';
  }
});
