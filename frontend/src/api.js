/**
 * Couche d'accès à l'API backend
 */

const API_BASE = '/api';

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Erreur HTTP ${response.status}`);
  }
  return data;
}

export const api = {
  /** Récupère (ou génère) les 10 sujets du jour */
  getDailyTopics: () => fetchJSON(`${API_BASE}/topics/daily`),

  /** Force une régénération de nouveaux sujets */
  regenerateTopics: () => fetchJSON(`${API_BASE}/topics/regenerate`, { method: 'POST' }),

  /** Enregistre un swipe : direction = 'left' | 'right' | 'up' */
  swipe: (id, direction) => fetchJSON(`${API_BASE}/topics/${id}/swipe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ direction }),
  }),

  /** Génère l'article complet d'un sujet */
  generateContent: (id) => fetchJSON(`${API_BASE}/topics/${id}/generate`, { method: 'POST' }),

  /** Récupère un sujet par ID */
  getTopic: (id) => fetchJSON(`${API_BASE}/topics/${id}`),

  /** Récupère les sujets likés (à lire plus tard) */
  getLikedTopics: () => fetchJSON(`${API_BASE}/topics/liked`),

  /** Récupère l'historique des sujets appris */
  getHistory: () => fetchJSON(`${API_BASE}/topics/history`),
};
