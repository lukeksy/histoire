const express = require('express');
const router  = express.Router();

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { password } = req.body;

  if (!process.env.APP_PASSWORD) {
    return res.status(500).json({ error: 'APP_PASSWORD non défini dans les variables d\'environnement.' });
  }

  if (password === process.env.APP_PASSWORD) {
    req.session.authenticated = true;
    return res.json({ ok: true });
  }

  res.status(401).json({ error: 'Mot de passe incorrect.' });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// ─── GET /api/auth/check ──────────────────────────────────────────────────────
// Vérifie si la session est active (utilisé au chargement de l'app)
router.get('/check', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.authenticated) });
});

module.exports = router;
