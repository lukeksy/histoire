const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { generateDailyTopics, generateTopicContent } = require('../services/claude');

// ─── GET /api/topics/daily ────────────────────────────────────────────────────
// Récupère les sujets du jour (les génère si besoin)
router.get('/daily', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Chercher les sujets d'aujourd'hui (tous statuts confondus)
    const existingTopics = db.prepare(
      `SELECT * FROM topics WHERE created_date = ? ORDER BY id`
    ).all(today);

    if (existingTopics.length > 0) {
      return res.json({ topics: existingTopics });
    }

    // Aucun sujet pour aujourd'hui → générer avec Claude
    console.log('🤖 Génération des sujets du jour via Claude...');
    const generatedTopics = await generateDailyTopics();

    const insert = db.prepare(`
      INSERT INTO topics (title, era, category, summary, status, created_date)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `);

    const insertMany = db.transaction((topics) => {
      for (const topic of topics) {
        insert.run(topic.title, topic.era, topic.category, topic.summary, today);
      }
    });
    insertMany(generatedTopics);

    const newTopics = db.prepare(
      `SELECT * FROM topics WHERE created_date = ? ORDER BY id`
    ).all(today);

    res.json({ topics: newTopics });
  } catch (error) {
    console.error('Erreur génération sujets:', error);
    res.status(500).json({ error: 'Erreur lors de la génération des sujets du jour.' });
  }
});

// ─── GET /api/topics/liked ────────────────────────────────────────────────────
// Récupère les sujets likés (droit ou super) non encore appris
router.get('/liked', (req, res) => {
  try {
    const topics = db.prepare(`
      SELECT * FROM topics
      WHERE status IN ('liked', 'super_liked')
      ORDER BY swiped_at DESC
    `).all();
    res.json({ topics });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des sujets likés.' });
  }
});

// ─── GET /api/topics/history ──────────────────────────────────────────────────
// Récupère l'historique des sujets appris
router.get('/history', (req, res) => {
  try {
    const topics = db.prepare(`
      SELECT * FROM topics
      WHERE status = 'learned'
      ORDER BY learned_at DESC
    `).all();
    res.json({ topics });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique.' });
  }
});

// ─── GET /api/topics/regenerate ──────────────────────────────────────────────
// Force la regénération de nouveaux sujets pour aujourd'hui
router.post('/regenerate', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Supprimer les sujets pending d'aujourd'hui
    db.prepare(`DELETE FROM topics WHERE created_date = ? AND status = 'pending'`).run(today);

    console.log('🔄 Régénération des sujets...');
    const generatedTopics = await generateDailyTopics();

    const insert = db.prepare(`
      INSERT INTO topics (title, era, category, summary, status, created_date)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `);
    const insertMany = db.transaction((topics) => {
      for (const topic of topics) {
        insert.run(topic.title, topic.era, topic.category, topic.summary, today);
      }
    });
    insertMany(generatedTopics);

    const newTopics = db.prepare(
      `SELECT * FROM topics WHERE created_date = ? ORDER BY id`
    ).all(today);

    res.json({ topics: newTopics });
  } catch (error) {
    console.error('Erreur régénération:', error);
    res.status(500).json({ error: 'Erreur lors de la régénération des sujets.' });
  }
});

// ─── GET /api/topics/:id ──────────────────────────────────────────────────────
// Récupère un sujet spécifique
router.get('/:id', (req, res) => {
  try {
    const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(req.params.id);
    if (!topic) return res.status(404).json({ error: 'Sujet non trouvé.' });
    res.json({ topic });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du sujet.' });
  }
});

// ─── POST /api/topics/:id/swipe ───────────────────────────────────────────────
// Enregistre l'action de swipe (left / right / up)
router.post('/:id/swipe', (req, res) => {
  try {
    const { id } = req.params;
    const { direction } = req.body;

    const statusMap = {
      left: 'disliked',
      right: 'liked',
      up: 'super_liked',
    };

    const newStatus = statusMap[direction];
    if (!newStatus) return res.status(400).json({ error: 'Direction invalide. Utilisez left, right ou up.' });

    db.prepare(`
      UPDATE topics SET status = ?, swiped_at = datetime('now') WHERE id = ?
    `).run(newStatus, id);

    const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(id);
    res.json({ topic });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du swipe.' });
  }
});

// ─── POST /api/topics/:id/generate ───────────────────────────────────────────
// Génère le contenu complet d'un sujet
router.post('/:id/generate', async (req, res) => {
  try {
    const { id } = req.params;
    const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(id);

    if (!topic) return res.status(404).json({ error: 'Sujet non trouvé.' });

    // Si le contenu est déjà généré, le retourner directement
    if (topic.content) {
      return res.json({ topic });
    }

    console.log(`📖 Génération du contenu pour : "${topic.title}"`);
    const content = await generateTopicContent(topic.title, topic.era, topic.category, topic.summary);

    db.prepare(`
      UPDATE topics
      SET content = ?,
          content_generated_at = datetime('now'),
          status = 'learned',
          learned_at = datetime('now')
      WHERE id = ?
    `).run(content, id);

    const updatedTopic = db.prepare('SELECT * FROM topics WHERE id = ?').get(id);
    res.json({ topic: updatedTopic });
  } catch (error) {
    console.error('Erreur génération contenu:', error);
    res.status(500).json({ error: 'Erreur lors de la génération de l\'article.' });
  }
});

module.exports = router;
