# Feedback Analysis MVP - with Database Backend

A complete feedback analysis application with sentiment analysis, theme extraction, and data persistence using SQLite database.

## ✨ Features

- **Data Ingestion**: Upload CSV files or paste feedback text
- **Database Storage**: SQLite database for persistent data storage
- **Sentiment Analysis**: Rule-based positive/negative/neutral classification
- **Theme Extraction**: Automatic categorization (Shipping, Support, Price, Quality, Website, Options)
- **Insights Dashboard**: Real-time analytics and visualizations
- **Data Cleaning**: Removes duplicates, spam, and validates entries

## 🏗️ Architecture

### Backend
- **Server**: Node.js + Express
- **Database**: SQLite3
- **API Endpoints**:
  - `GET /api/feedback` - Retrieve all feedback
  - `POST /api/feedback` - Save new feedback
  - `DELETE /api/feedback/:id` - Delete feedback by ID

### Frontend
- Vanilla JavaScript
- Fetch API for backend communication
- Responsive CSS design

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Start the server**:
```bash
node server.js
```

3. **Access the application**:
Open your browser and navigate to:
```
http://localhost:3000
```

## 📁 Project Structure

```
feedback-mvp/
├── server.js              # Express server + SQLite setup
├── package.json           # Dependencies
├── feedback.db            # SQLite database (created automatically)
├── feedback.csv           # Sample data (migrated to DB on first run)
├── index.html             # Home page
├── ingest.html            # Data upload interface
├── dashboard.html         # Analytics dashboard
├── ingest.js              # Upload logic with API integration
├── dashboard.js           # Dashboard logic with API integration
├── style.css              # Styling
└── .gitignore             # Git ignore rules
```

## 🔧 How It Works

### Data Ingestion Flow
1. User uploads CSV or pastes text feedback
2. Frontend validates and cleans the data
3. Sentiment analysis runs on each entry
4. Data is sent to backend via POST `/api/feedback`
5. Server stores in SQLite database

### Dashboard Flow
1. Frontend fetches data via GET `/api/feedback`
2. Analyzes sentiment distribution
3. Extracts key themes
4. Displays insights and full feedback list

## 📊 Database Schema

```sql
CREATE TABLE feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  sentiment TEXT,
  confidence REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## 🔌 API Reference

### Get All Feedback
```
GET /api/feedback
Response: { data: [{ id, text, sentiment, confidence, created_at }] }
```

### Add Feedback
```
POST /api/feedback
Body: { text: string, sentiment?: string, confidence?: number }
Response: { id, text, sentiment, confidence }
```

### Delete Feedback
```
DELETE /api/feedback/:id
Response: { deleted: number }
```

## 🎯 Future Enhancements

- [ ] Advanced NLP sentiment analysis
- [ ] Export analytics to PDF/CSV
- [ ] User authentication
- [ ] Real-time updates with WebSockets
- [ ] PostgreSQL for production deployment
- [ ] Data visualization charts
- [ ] Search and filter functionality
- [ ] Batch operations

## 📝 Notes

- The server automatically migrates existing CSV data to the database on first run
- Database file (`feedback.db`) is created automatically
- All timestamps are in UTC
- CORS is enabled for local development

## 🛠️ Troubleshooting

**Server won't start?**
- Make sure port 3000 is not in use
- Check that Node.js is installed: `node --version`

**Can't save feedback?**
- Ensure server is running
- Check browser console for errors
- Verify database file permissions

**Database issues?**
- Delete `feedback.db` to reset (data will be lost)
- Server will recreate database on next start

## 📄 License

ISC
