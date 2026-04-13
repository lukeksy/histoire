/**
 * Stockage JSON — remplace better-sqlite3
 * Aucune dépendance native, fonctionne partout (Hostinger inclus)
 *
 * Chemin des données :
 *   - Si DATA_PATH est défini dans .env → utilise ce dossier (recommandé en prod)
 *   - Sinon → utilise data/ dans le dossier de l'application (dev local)
 *
 * Sur Hostinger, définissez DATA_PATH=/home/u800131214/histoire-data
 * pour persister les données entre les déploiements.
 */

const fs   = require('fs');
const path = require('path');

const DATA_DIR  = process.env.DATA_PATH || path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'histoire.json');

// ── Lecture / écriture du fichier JSON ────────────────────────────────────────

function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    return { topics: [], nextId: 1 };
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return { topics: [], nextId: 1 };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ── Initialisation ─────────────────────────────────────────────────────────────

function initDatabase() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) writeData({ topics: [], nextId: 1 });
  console.log(`✅ Stockage JSON initialisé → ${DATA_FILE}`);
}

// ── Fonctions CRUD ─────────────────────────────────────────────────────────────

function getTopicsByDate(date) {
  return readData().topics.filter(t => t.created_date === date);
}

function insertTopics(topicsToInsert, date) {
  const data = readData();
  for (const t of topicsToInsert) {
    data.topics.push({
      id:                   data.nextId++,
      title:                t.title,
      era:                  t.era,
      category:             t.category,
      summary:              t.summary,
      content:              null,
      status:               'pending',
      created_date:         date,
      swiped_at:            null,
      content_generated_at: null,
      learned_at:           null,
    });
  }
  writeData(data);
  return data.topics.filter(t => t.created_date === date);
}

function getTopicById(id) {
  const data = readData();
  return data.topics.find(t => t.id === parseInt(id, 10)) || null;
}

function updateTopic(id, updates) {
  const data  = readData();
  const index = data.topics.findIndex(t => t.id === parseInt(id, 10));
  if (index === -1) return null;
  data.topics[index] = { ...data.topics[index], ...updates };
  writeData(data);
  return data.topics[index];
}

function getLikedTopics() {
  return readData().topics
    .filter(t => t.status === 'liked' || t.status === 'super_liked')
    .sort((a, b) => (b.swiped_at || '').localeCompare(a.swiped_at || ''));
}

function getLearnedTopics() {
  return readData().topics
    .filter(t => t.status === 'learned')
    .sort((a, b) => (b.learned_at || '').localeCompare(a.learned_at || ''));
}

function deletePendingByDate(date) {
  const data = readData();
  data.topics = data.topics.filter(
    t => !(t.created_date === date && t.status === 'pending')
  );
  writeData(data);
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  initDatabase,
  getTopicsByDate,
  insertTopics,
  getTopicById,
  updateTopic,
  getLikedTopics,
  getLearnedTopics,
  deletePendingByDate,
};
