const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Initialize SQLite database
const db = new sqlite3.Database('./feedback.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    // Create feedback table if it doesn't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        sentiment TEXT,
        confidence REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      } else {
        console.log('Feedback table ready');
        // Migrate existing CSV data on first run
        migrateCSVData();
      }
    });
  }
});

// Migrate existing CSV data to database (run once)
function migrateCSVData() {
  const fs = require('fs');
  const csvPath = path.join(__dirname, 'feedback.csv');
  
  if (fs.existsSync(csvPath)) {
    db.get('SELECT COUNT(*) as count FROM feedback', (err, row) => {
      if (err) {
        console.error('Error checking data:', err.message);
        return;
      }
      
      // Only migrate if database is empty
      if (row.count === 0) {
        const csvData = fs.readFileSync(csvPath, 'utf-8');
        const lines = csvData.split(/\r?\n/).filter(line => line.trim());
        
        const stmt = db.prepare('INSERT INTO feedback (text) VALUES (?)');
        lines.forEach(line => {
          stmt.run(line.trim());
        });
        stmt.finalize();
        console.log(`Migrated ${lines.length} feedback entries from CSV`);
      }
    });
  }
}

// API Routes

// GET all feedback
app.get('/api/feedback', (req, res) => {
  db.all('SELECT * FROM feedback ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

// POST new feedback
app.post('/api/feedback', (req, res) => {
  const { text, sentiment, confidence } = req.body;
  
  if (!text) {
    res.status(400).json({ error: 'Feedback text is required' });
    return;
  }
  
  db.run(
    'INSERT INTO feedback (text, sentiment, confidence) VALUES (?, ?, ?)',
    [text, sentiment || null, confidence || null],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        id: this.lastID,
        text,
        sentiment,
        confidence
      });
    }
  );
});

// DELETE feedback by ID
app.delete('/api/feedback/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM feedback WHERE id = ?', id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ deleted: this.changes });
  });
});

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/ingest', (req, res) => {
  res.sendFile(path.join(__dirname, 'ingest.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});
