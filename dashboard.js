// Loads feedback.csv, analyzes sentiment, extracts themes, and updates dashboard
async function fetchCSV() {
  const response = await fetch('feedback.csv');
  return response.text();
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
  feedbackArr.forEach(text => {
    const sentiment = analyzeSentiment(text);
    sentiments[sentiment]++;
  });
  const total = feedbackArr.length;
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
    feedbackArr.map(text => `<li>${text}</li>`).join('');
}

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const csv = await fetchCSV();
    const feedbackArr = csv.split(/\r?\n/).map(row => row.trim()).filter(row => row.length > 0);
    renderDashboard(feedbackArr);
  } catch (err) {
    document.getElementById('sentiment-breakdown').textContent = 'Error loading feedback.';
    document.getElementById('theme-list').textContent = '';
    document.getElementById('feedback-list').textContent = '';
  }
});
