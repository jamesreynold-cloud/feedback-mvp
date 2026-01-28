// Simple sentiment analysis (rule-based for MVP)
function analyzeSentiment(text) {
  // Basic positive/negative word lists
  const positiveWords = [
    'great', 'satisfied', 'loved', 'amazing', 'fast', 'easy', 'vibrant', 'true', 'helpful', 'quality', 'good', 'best', 'happy', 'recommend', 'excellent', 'awesome', 'love', 'perfect', 'fantastic', 'enjoy', 'like', 'buy again'
  ];
  const negativeWords = [
    'confusing', 'unhelpful', 'damaged', 'expensive', 'bad', 'worst', 'difficult', 'problem', 'issue', 'broken', 'slow', 'hate', 'dislike', 'poor', 'hard', 'complain', 'refund', 'return', 'missing', 'late', 'wrong', 'never again'
  ];
  let score = 0;
  let posMatches = 0, negMatches = 0;
  const words = text.split(/\s+/);
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
  let confidence = 0.5;
  if (score > 0) {
    sentiment = 'positive';
    confidence = Math.min(1, 0.5 + 0.1 * posMatches);
  } else if (score < 0) {
    sentiment = 'negative';
    confidence = Math.min(1, 0.5 + 0.1 * negMatches);
  }
  return { sentiment, confidence: confidence.toFixed(2) };
}
// Handles CSV and text input, validates for empty/duplicate rows

// Basic text cleaning: lowercase, remove extra spaces, strip punctuation (except emojis), filter short/spam
function cleanText(text) {
  // Remove URLs, excessive whitespace, and most punctuation (keep emojis)
  let cleaned = text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, '') // remove URLs
    .replace(/[\p{P}$+<=>^`|~]/gu, '') // remove most punctuation
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();
  // Remove if too short or looks like spam
  if (cleaned.length < 5 || /free money|click here|buy now/.test(cleaned)) return '';
  return cleaned;
}

function parseCSV(text) {
  return text.split(/\r?\n/).map(row => row.trim()).filter(row => row.length > 0);
}

function validateAndCleanFeedback(feedbackArr) {
  const seen = new Set();
  const unique = [];
  const duplicates = [];
  const cleaned = [];
  feedbackArr.forEach(item => {
    const cleanedItem = cleanText(item);
    if (!cleanedItem) return; // skip empty/irrelevant
    if (seen.has(cleanedItem)) {
      duplicates.push(cleanedItem);
    } else {
      seen.add(cleanedItem);
      unique.push(cleanedItem);
      cleaned.push(cleanedItem);
    }
  });
  return { unique: cleaned, duplicates };
}


// Save feedback to database via API
async function saveFeedbackToDB(feedbackArray) {
  const results = { success: 0, failed: 0 };
  for (const text of feedbackArray) {
    const { sentiment, confidence } = analyzeSentiment(text);
    try {
      const response = await fetch('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sentiment, confidence })
      });
      if (response.ok) {
        results.success++;
      } else {
        results.failed++;
      }
    } catch (err) {
      console.error('Error saving feedback:', err);
      results.failed++;
    }
  }
  return results;
}

document.getElementById('csv-upload-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const fileInput = document.getElementById('csvFile');
  const resultsDiv = document.getElementById('validation-results');
  if (!fileInput.files.length) {
    resultsDiv.textContent = 'Please select a CSV file.';
    return;
  }
  const reader = new FileReader();
  reader.onload = async function(event) {
    const rows = parseCSV(event.target.result);
    const { unique, duplicates } = validateAndCleanFeedback(rows);
    
    // Save to database
    resultsDiv.innerHTML = '<b>Saving to database...</b>';
    const saveResults = await saveFeedbackToDB(unique);
    
    // Sentiment analysis display
    const sentimentResults = unique.map(text => {
      const { sentiment, confidence } = analyzeSentiment(text);
      return `<li>${text}<br><b>Sentiment:</b> ${sentiment} <b>Confidence:</b> ${confidence}</li>`;
    }).join('');
    
    resultsDiv.innerHTML = `
      <b>Saved to database:</b> ${saveResults.success} entries<br>
      <b>Failed:</b> ${saveResults.failed}<br>
      <b>Valid, cleaned feedback entries:</b> ${unique.length}<br>
      <b>Duplicates removed:</b> ${duplicates.length}<br>
      <ul>${sentimentResults}</ul>
    `;
  };
  reader.readAsText(fileInput.files[0]);
});

document.getElementById('text-upload-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const textInput = document.getElementById('textInput').value;
  const rows = parseCSV(textInput);
  const { unique, duplicates } = validateAndCleanFeedback(rows);
  
  const resultsDiv = document.getElementById('validation-results');
  
  // Save to database
  resultsDiv.innerHTML = '<b>Saving to database...</b>';
  const saveResults = await saveFeedbackToDB(unique);
  
  // Sentiment analysis display
  const sentimentResults = unique.map(text => {
    const { sentiment, confidence } = analyzeSentiment(text);
    return `<li>${text}<br><b>Sentiment:</b> ${sentiment} <b>Confidence:</b> ${confidence}</li>`;
  }).join('');
  
  resultsDiv.innerHTML = `
    <b>Saved to database:</b> ${saveResults.success} entries<br>
    <b>Failed:</b> ${saveResults.failed}<br>
    <b>Valid, cleaned feedback entries:</b> ${unique.length}<br>
    <b>Duplicates removed:</b> ${duplicates.length}<br>
    <ul>${sentimentResults}</ul>
  `;
});
