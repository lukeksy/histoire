const express = require('express');
const router  = express.Router();
const db      = require('../database');
const { generateDailyTopics, generateTopicContent } = require('../services/claude');

function now() {
  return new Date().toISOString();
}

// ─── GET /api/topics/daily ────────────────────────────────────────────────────
router.get('/daily', async (req, res) => {
  try {
    const today    = new Date().toISOString().split('T')[0];
    const existing = db.getTopicsByDate(today);

    if (existing.length > 0) {
      return res.json({ topics: existing });
    }

    console.log('🤖 Génération des sujets du jour via Claude...');
    const generated = await generateDailyTopics();
    const topics    = db.insertTopics(generated, today);

    res.json({ topics });
  } catch (error) {
    console.error('Erreur génération sujets:', error);
    // Retourne le détail de l'erreur pour faciliter le diagnostic
    res.status(500).json({
      error: 'Erreur lors de la génération des sujets du jour.',
      detail: error.message,
      hint: !process.env.ANTHROPIC_API_KEY
        ? 'ANTHROPIC_API_KEY manquante — configurez-la dans les variables d\'environnement Hostinger.'
        : null,
    });
  }
});

// ─── GET /api/topics/liked ────────────────────────────────────────────────────
router.get('/liked', (req, res) => {
  try {
    res.json({ topics: db.getLikedTopics() });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des sujets likés.' });
  }
});

// ─── GET /api/topics/history ──────────────────────────────────────────────────
router.get('/history', (req, res) => {
  try {
    res.json({ topics: db.getLearnedTopics() });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique.' });
  }
});

// ─── POST /api/topics/regenerate ─────────────────────────────────────────────
router.post('/regenerate', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    db.deletePendingByDate(today);

    console.log('🔄 Régénération des sujets...');
    const generated = await generateDailyTopics();
    const topics    = db.insertTopics(generated, today);

    res.json({ topics });
  } catch (error) {
    console.error('Erreur régénération:', error);
    res.status(500).json({ error: 'Erreur lors de la régénération des sujets.' });
  }
});

// ─── GET /api/topics/:id ──────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const topic = db.getTopicById(req.params.id);
    if (!topic) return res.status(404).json({ error: 'Sujet non trouvé.' });
    res.json({ topic });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du sujet.' });
  }
});

// ─── POST /api/topics/:id/swipe ───────────────────────────────────────────────
router.post('/:id/swipe', (req, res) => {
  try {
    const { id }       = req.params;
    const { direction } = req.body;

    const statusMap = { left: 'disliked', right: 'liked', up: 'super_liked' };
    const newStatus = statusMap[direction];
    if (!newStatus) return res.status(400).json({ error: 'Direction invalide.' });

    const topic = db.updateTopic(id, { status: newStatus, swiped_at: now() });
    if (!topic) return res.status(404).json({ error: 'Sujet non trouvé.' });

    res.json({ topic });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du swipe.' });
  }
});

// ─── POST /api/topics/:id/generate ───────────────────────────────────────────
router.post('/:id/generate', async (req, res) => {
  try {
    const { id } = req.params;
    const topic  = db.getTopicById(id);

    if (!topic) return res.status(404).json({ error: 'Sujet non trouvé.' });
    if (topic.content) return res.json({ topic }); // déjà généré

    console.log(`📖 Génération du contenu pour : "${topic.title}"`);
    const content = await generateTopicContent(
      topic.title, topic.era, topic.category, topic.summary
    );

    const updated = db.updateTopic(id, {
      content,
      content_generated_at: now(),
      status:               'learned',
      learned_at:           now(),
    });

    res.json({ topic: updated });
  } catch (error) {
    console.error('Erreur génération contenu:', error);
    res.status(500).json({ error: 'Erreur lors de la génération de l\'article.' });
  }
});

module.exports = router;
