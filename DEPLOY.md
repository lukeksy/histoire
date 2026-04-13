# Guide de déploiement — Histoire de France

## 1. Développement en local

### Prérequis
- Node.js 18+
- npm

### Première installation

```bash
# 1. Copier le fichier de configuration
cp .env.example .env

# 2. Éditer .env et ajouter votre clé Claude
nano .env   # ou ouvrez le fichier dans votre éditeur

# 3. Installer les dépendances backend
npm install

# 4. Installer les dépendances frontend et builder React
npm run build
```

### Lancer l'application en local

**Option A — Tout en un (mode production local)**
```bash
npm start
# → http://localhost:3000
```

**Option B — Mode développement (hot reload frontend)**

Terminal 1 (backend) :
```bash
npm run dev:backend
```

Terminal 2 (frontend) :
```bash
npm run dev:frontend
# → http://localhost:5173 (proxy vers le backend)
```

---

## 2. Déploiement sur Hostinger

### Étape 1 — Préparer votre projet

Sur votre machine, buildez le frontend avant d'envoyer les fichiers :
```bash
npm run build
```
Cela crée le dossier `public/` avec l'application React compilée.

### Étape 2 — Fichiers à uploader sur Hostinger

Uploadez **tout le dossier** sauf :
- `node_modules/` (sera installé sur le serveur)
- `frontend/node_modules/`
- `data/` (créé automatiquement au démarrage)
- `.env` (à créer directement sur le serveur)

Structure à uploader :
```
histoire-france/
├── server.js
├── package.json
├── backend/
├── public/          ← dossier React compilé
└── .env             ← à créer sur le serveur
```

### Étape 3 — Configuration sur Hostinger

1. Dans le panel Hostinger, aller dans **Node.js** → **Gérer**
2. Définir :
   - **Entry point** : `server.js`
   - **Node.js version** : 18 ou plus récent
3. Dans la section **Variables d'environnement**, ajouter :
   - `ANTHROPIC_API_KEY` = votre clé Claude
   - `NODE_ENV` = `production`
4. Cliquer sur **Installer les dépendances npm**
5. Cliquer sur **Redémarrer**

### Étape 4 — Vérification

- L'application est accessible à votre domaine Hostinger
- La base de données SQLite sera créée automatiquement dans `data/histoire.db`

---

## 3. Structure des fichiers

```
histoire-france/
├── server.js                    ← Point d'entrée Express
├── package.json                 ← Dépendances backend
├── .env                         ← Variables secrètes (NE PAS versionner)
├── .env.example                 ← Modèle de configuration
│
├── backend/
│   ├── database.js              ← Connexion SQLite
│   ├── routes/
│   │   └── topics.js            ← Routes API /api/topics/*
│   └── services/
│       └── claude.js            ← Appels à l'API Claude
│
├── frontend/                    ← Code source React (dev seulement)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── api.js
│   │   ├── pages/
│   │   │   ├── SwipePage.jsx
│   │   │   ├── LikedPage.jsx
│   │   │   ├── HistoryPage.jsx
│   │   │   └── TopicDetailPage.jsx
│   │   └── components/
│   │       ├── Navbar.jsx
│   │       └── LoadingSpinner.jsx
│   └── package.json
│
├── public/                      ← React compilé (généré par npm run build)
└── data/
    └── histoire.db              ← Base de données SQLite (auto-créé)
```

---

## 4. Routes API

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/topics/daily` | Sujets du jour (génère si besoin) |
| POST | `/api/topics/regenerate` | Force de nouveaux sujets |
| POST | `/api/topics/:id/swipe` | Enregistre left/right/up |
| POST | `/api/topics/:id/generate` | Génère l'article complet |
| GET | `/api/topics/liked` | Sujets likés |
| GET | `/api/topics/history` | Sujets appris |
| GET | `/api/topics/:id` | Détail d'un sujet |

---

## 5. Conseils

- **Coût API** : Chaque batch de 10 sujets coûte ~$0.01. Un article complet ~$0.03–0.05.
- **La base de données** `data/histoire.db` doit être conservée entre les redémarrages.
  Sur Hostinger, les fichiers persistent — pas de problème.
- **Sauvegarde** : Téléchargez régulièrement `data/histoire.db` pour sauvegarder votre historique.
