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
  const apiUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api/feedback'
    : '/api/feedback';
    
  for (const text of feedbackArray) {
    const { sentiment, confidence } = analyzeSentiment(text);
    try {
      const response = await fetch(apiUrl, {
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

const csvSubmitBtn = document.getElementById('csv-submit-btn');
const textSubmitBtn = document.getElementById('text-submit-btn');
let isCsvSubmitting = false;
let isTextSubmitting = false;

function setSubmittingState(type, isSubmitting) {
  if (type === 'csv') {
    isCsvSubmitting = isSubmitting;
    csvSubmitBtn.disabled = isSubmitting;
    csvSubmitBtn.innerHTML = isSubmitting
      ? 'Submitting...'
      : '<span>Upload file</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>';
  } else if (type === 'text') {
    isTextSubmitting = isSubmitting;
    textSubmitBtn.disabled = isSubmitting;
    textSubmitBtn.textContent = isSubmitting ? 'Submitting...' : 'Submit text';
  }
}

function showStatusMessage(message, statusClass) {
  const resultsDiv = document.getElementById('validation-results');
  resultsDiv.className = `validation-results ${statusClass}`;
  resultsDiv.innerHTML = message;
}

document.getElementById('csv-upload-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const fileInput = document.getElementById('csvFile');
  const resultsDiv = document.getElementById('validation-results');
  
  if (isCsvSubmitting) return;
  
  if (!fileInput.files.length) {
    showStatusMessage('Please select a file first.', 'error');
    return;
  }

  const selectedFile = fileInput.files[0];
  const fileName = selectedFile.name || '';
  const lowerName = fileName.toLowerCase();

  const isTxt = lowerName.endsWith('.txt');
  const isCsv = lowerName.endsWith('.csv');

  if (!isTxt && !isCsv) {
    showStatusMessage('Only .txt or .csv files are allowed.', 'error');
    return;
  }

  if (!lowerName.includes('feedback')) {
    showStatusMessage('Filename must include “feedback”. Please rename your file.', 'error');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = async function(event) {
    try {
      setSubmittingState('csv', true);
      const rows = parseCSV(event.target.result);
      const { unique } = validateAndCleanFeedback(rows);
      
      showStatusMessage('<b>Submitting...</b>', '');
      const saveResults = await saveFeedbackToDB(unique);
      
      if (saveResults.success > 0 && saveResults.failed === 0) {
        showStatusMessage(
          `
            ✓ Feedback saved.<br>
            Total uploaded: ${rows.length}<br>
            Removed: ${rows.length - unique.length}<br>
            Valid analyzed: ${unique.length}<br>
            <br><a href="dashboard.html" style="color: #065f46; font-weight: 600;">View dashboard →</a>
          `,
          'success'
        );
      } else if (saveResults.success > 0) {
        showStatusMessage(
          `
            ✓ Feedback saved with some errors.<br>
            Total uploaded: ${rows.length}<br>
            Removed: ${rows.length - unique.length}<br>
            Valid analyzed: ${unique.length}<br>
            Failed: ${saveResults.failed}
          `,
          'error'
        );
      } else {
        showStatusMessage('Failed to save feedback. Please try again.', 'error');
      }
    } catch (err) {
      console.error('CSV submit error:', err);
      showStatusMessage('Something went wrong while saving. Please try again.', 'error');
    } finally {
      setSubmittingState('csv', false);
    }
  };
  reader.readAsText(fileInput.files[0]);
});

document.getElementById('text-upload-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const textInput = document.getElementById('textInput').value;
  
  if (isTextSubmitting) return;
  
  if (!textInput.trim()) {
    showStatusMessage('Please enter some feedback text.', 'error');
    return;
  }
  
  const rows = parseCSV(textInput);
  const { unique } = validateAndCleanFeedback(rows);
  
  try {
    setSubmittingState('text', true);
    showStatusMessage('<b>Submitting...</b>', '');
    const saveResults = await saveFeedbackToDB(unique);
    
    if (saveResults.success > 0 && saveResults.failed === 0) {
      showStatusMessage(
        `
          ✓ Feedback saved.<br>
          Total uploaded: ${rows.length}<br>
          Removed: ${rows.length - unique.length}<br>
          Valid analyzed: ${unique.length}<br>
          <br><a href="dashboard.html" style="color: #065f46; font-weight: 600;">View dashboard →</a>
        `,
        'success'
      );
      document.getElementById('textInput').value = '';
    } else if (saveResults.success > 0) {
      showStatusMessage(
        `
          ✓ Feedback saved with some errors.<br>
          Total uploaded: ${rows.length}<br>
          Removed: ${rows.length - unique.length}<br>
          Valid analyzed: ${unique.length}<br>
          Failed: ${saveResults.failed}
        `,
        'error'
      );
    } else {
      showStatusMessage('Failed to save feedback. Please try again.', 'error');
    }
  } catch (err) {
    console.error('Text submit error:', err);
    showStatusMessage('Something went wrong while saving. Please try again.', 'error');
  } finally {
    setSubmittingState('text', false);
  }
});

// Update file input display when file is selected
const csvFileInput = document.getElementById('csvFile');
const fileNameLabel = document.querySelector('.file-name');
const fileInputDisplay = document.querySelector('.file-input-display');

csvFileInput.addEventListener('change', function(e) {
  const fileName = e.target.files[0]?.name || 'Choose a file...';
  fileNameLabel.textContent = fileName;
});

if (fileInputDisplay) {
  fileInputDisplay.addEventListener('click', () => {
    csvFileInput.click();
  });

  fileInputDisplay.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      csvFileInput.click();
    }
  });
}
