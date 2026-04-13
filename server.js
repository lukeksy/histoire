require('dotenv').config();
const express     = require('express');
const session     = require('express-session');
const path        = require('path');
const fs          = require('fs');
const { initDatabase } = require('./backend/database');
const requireAuth      = require('./backend/middleware/requireAuth');
const authRouter       = require('./backend/routes/auth');
const topicsRouter     = require('./backend/routes/topics');

const app    = express();
const PORT   = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');

// Hostinger utilise un reverse proxy — nécessaire pour les cookies sécurisés
app.set('trust proxy', 1);

// Initialisation du stockage
initDatabase();

// ── Middlewares ───────────────────────────────────────────────────────────────
app.use(express.json());

app.use(session({
  secret:            process.env.SESSION_SECRET || 'dev-secret-insecure',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure:   process.env.NODE_ENV === 'production', // HTTPS sur Hostinger
    maxAge:   7 * 24 * 60 * 60 * 1000,              // 7 jours
  },
}));

// ── Routes ────────────────────────────────────────────────────────────────────

// Auth — publique (pas besoin d'être connecté pour se connecter)
app.use('/api/auth', authRouter);

// Topics — protégées par session
app.use('/api/topics', requireAuth, topicsRouter);

// ── Frontend React ────────────────────────────────────────────────────────────
if (fs.existsSync(PUBLIC)) {
  app.use(express.static(PUBLIC));
  app.get('*', (req, res) => {
    res.sendFile(path.join(PUBLIC, 'index.html'));
  });
  console.log('🖥️  Frontend React servi depuis /public');
} else {
  console.warn('⚠️  Dossier public/ introuvable — lancez "npm run build".');
  app.get('/', (req, res) => {
    res.send('<h2>API en ligne ✅</h2><p>Lancez <code>npm run build</code> puis redémarrez.</p>');
  });
}

// ── Démarrage ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré → http://localhost:${PORT}`);
  if (!process.env.APP_PASSWORD)   console.warn('⚠️  APP_PASSWORD non défini dans .env !');
  if (!process.env.SESSION_SECRET) console.warn('⚠️  SESSION_SECRET non défini dans .env !');
  if (!process.env.ANTHROPIC_API_KEY) console.warn('⚠️  ANTHROPIC_API_KEY non défini dans .env !');
});
