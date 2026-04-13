const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Dossier pour stocker la base de données
const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Connexion à la base de données SQLite
const db = new Database(path.join(DATA_DIR, 'histoire.db'));

// Activer les performances WAL (meilleure concurrence)
db.pragma('journal_mode = WAL');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      era TEXT,
      category TEXT,
      summary TEXT,
      content TEXT,
      status TEXT DEFAULT 'pending',
      created_date TEXT NOT NULL,
      swiped_at TEXT,
      content_generated_at TEXT,
      learned_at TEXT
    );
  `);
  console.log('✅ Base de données initialisée');
}

module.exports = { db, initDatabase };
