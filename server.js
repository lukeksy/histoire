require('dotenv').config();
const express = require('express');
const path    = require('path');
const fs      = require('fs');
const { initDatabase } = require('./backend/database');
const topicsRouter     = require('./backend/routes/topics');

const app    = express();
const PORT   = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');

// Initialisation du stockage au démarrage
initDatabase();

// Middleware pour lire le JSON des requêtes
app.use(express.json());

// Routes de l'API
app.use('/api/topics', topicsRouter);

// Servir le frontend React si le dossier public/ existe
if (fs.existsSync(PUBLIC)) {
  app.use(express.static(PUBLIC));
  app.get('*', (req, res) => {
    res.sendFile(path.join(PUBLIC, 'index.html'));
  });
  console.log('🖥️  Frontend React servi depuis /public');
} else {
  console.warn('⚠️  Dossier public/ introuvable — lancez "npm run build" pour compiler le frontend.');
  app.get('/', (req, res) => {
    res.send('<h2>API en ligne ✅</h2><p>Le frontend n\'est pas encore compilé.<br>Lancez <code>npm run build</code> puis redémarrez le serveur.</p>');
  });
}

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré → http://localhost:${PORT}`);
});
