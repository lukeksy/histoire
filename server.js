require('dotenv').config();
const express = require('express');
const path = require('path');
const { initDatabase } = require('./backend/database');
const topicsRouter = require('./backend/routes/topics');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialisation de la base de données au démarrage
initDatabase();

// Middleware pour lire le JSON des requêtes
app.use(express.json());

// Routes de l'API
app.use('/api/topics', topicsRouter);

// En production, servir l'application React compilée
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  // Toutes les autres routes renvoient vers React
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`✅ Serveur Histoire de France démarré sur le port ${PORT}`);
  console.log(`🌍 http://localhost:${PORT}`);
});
