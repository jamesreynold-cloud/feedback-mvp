// Dashboard Script - Feedback Analysis MVP
console.log('Dashboard.js loaded!');

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
  const feedbackWithSentiment = [];
  
  // Analyze each feedback
  feedbackArr.forEach(item => {
    const sentiment = item.sentiment || analyzeSentiment(item.text);
    sentiments[sentiment]++;
    feedbackWithSentiment.push({
      text: item.text,
      sentiment: sentiment,
      confidence: item.confidence || '0.50'
    });
  });
  
  const total = feedbackArr.length || 1;
  
  // Update sentiment counts
  document.getElementById('positive-count').textContent = sentiments.positive;
  document.getElementById('neutral-count').textContent = sentiments.neutral;
  document.getElementById('negative-count').textContent = sentiments.negative;

  // Extract themes from text
  const feedbackTexts = feedbackArr.map(item => item.text);
  const themes = extractThemes(feedbackTexts);
  
  // Find top concern (highest negative theme or highest overall theme)
  const sortedThemes = Object.entries(themes)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);
  
  if (sortedThemes.length > 0) {
    const [topTheme, topCount] = sortedThemes[0];
    const percentage = ((topCount / total) * 100).toFixed(0);
    document.getElementById('primary-insight-title').textContent = 
      `${topTheme} appears to be the most common theme`;
    document.getElementById('primary-insight-evidence').textContent = 
      `We found this in ${percentage}% of feedback (${topCount} out of ${total} comments)`;
  } else {
    document.getElementById('primary-insight-title').textContent = 
      'No clear themes identified yet';
    document.getElementById('primary-insight-evidence').textContent = 
      'Upload more feedback to discover insights';
  }
  
  // Render themes as tags
  document.getElementById('theme-list').innerHTML =
    sortedThemes.length > 0
      ? sortedThemes.map(([theme, count]) =>
          `<span class="theme-tag">${theme} <span class="theme-count">${count}</span></span>`
        ).join('')
      : '<p style="color: var(--color-text-muted);">No themes identified yet</p>';

  // Render individual feedback items
  document.getElementById('feedback-list').innerHTML =
    feedbackWithSentiment.length > 0 
      ? feedbackWithSentiment.map(item => `
          <div class="feedback-item">
            <p class="feedback-text">${item.text}</p>
            <div class="feedback-meta">
              <span class="sentiment-badge ${item.sentiment}">${item.sentiment}</span>
              <span class="confidence-badge">Confidence: ${(parseFloat(item.confidence) * 100).toFixed(0)}%</span>
            </div>
          </div>
        `).join('')
      : '<p style="color: var(--color-text-muted); padding: 2rem; text-align: center;">No feedback available. <a href="ingest.html" style="color: #667eea;">Upload feedback</a></p>';
}

// Copy summary functionality
function setupCopySummary() {
  const copyBtn = document.getElementById('copy-summary-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const title = document.getElementById('primary-insight-title').textContent;
      const evidence = document.getElementById('primary-insight-evidence').textContent;
      const summary = `${title}\n${evidence}`;
      
      try {
        await navigator.clipboard.writeText(summary);
        copyBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Copied!
        `;
        setTimeout(() => {
          copyBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy summary
          `;
        }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  console.log('Dashboard loaded, fetching feedback...');
  setupCopySummary();
  
  try {
    const feedbackData = await fetchFeedback();
    console.log('Got feedback data:', feedbackData);
    
    if (!feedbackData || feedbackData.length === 0) {
      document.getElementById('primary-insight-title').textContent = 'No feedback data yet';
      document.getElementById('primary-insight-evidence').textContent = 'Upload your first feedback to discover insights';
      document.getElementById('positive-count').textContent = '0';
      document.getElementById('neutral-count').textContent = '0';
      document.getElementById('negative-count').textContent = '0';
      document.getElementById('theme-list').innerHTML = '<p style="color: var(--color-text-muted);">No themes yet</p>';
      document.getElementById('feedback-list').innerHTML = '<p style="color: var(--color-text-muted); padding: 2rem; text-align: center;">No feedback available. <a href="ingest.html" style="color: #667eea;">Upload feedback</a></p>';
      return;
    }
    
    console.log('Processing feedback:', feedbackData);
    renderDashboard(feedbackData);
    console.log('Dashboard rendered successfully');
  } catch (err) {
    console.error('Error loading feedback:', err);
    const errorMsg = `Error: ${err.message}`;
    document.getElementById('primary-insight-title').textContent = 'Unable to load data';
    document.getElementById('primary-insight-evidence').textContent = errorMsg;
  }
});
