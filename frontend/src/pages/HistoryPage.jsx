import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORY_ICONS = {
  'Politique':    '👑',
  'Guerre':       '⚔️',
  'Religion':     '✝️',
  'Société':      '🏘️',
  'Économie':     '💰',
  'Art & Culture':'🎨',
  'Science':      '🔭',
  'Personnage':   '👤',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

export default function HistoryPage() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getHistory()
      .then(data => setTopics(data.topics))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Chargement de l'historique..." />;

  return (
    <div>
      <div className="page-header">
        <h1>📚 Appris</h1>
        <p className="subtitle">
          {topics.length === 0
            ? 'Aucun sujet étudié'
            : `${topics.length} sujet${topics.length > 1 ? 's' : ''} étudié${topics.length > 1 ? 's' : ''}`}
        </p>
      </div>

      {topics.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🏰</span>
          <h3>Votre bibliothèque est vide</h3>
          <p>
            Les sujets que vous étudiez apparaîtront ici.
            Commencez par swiper ou choisissez un sujet dans vos likés.
          </p>
        </div>
      ) : (
        <div className="topics-list">
          {topics.map(topic => (
            <div key={topic.id} className="topic-item">
              <div className="topic-item-header">
                <h3 className="topic-item-title">{topic.title}</h3>
              </div>

              <div className="topic-item-footer">
                <div className="topic-item-meta">
                  <span className="badge badge-category" style={{ fontSize: 11 }}>
                    {CATEGORY_ICONS[topic.category] || '📚'} {topic.category}
                  </span>
                  <span className="badge badge-era" style={{ fontSize: 11 }}>
                    {topic.era}
                  </span>
                </div>
                <button
                  className="btn-read"
                  onClick={() => navigate(`/topic/${topic.id}`)}
                >
                  Relire →
                </button>
              </div>

              {topic.learned_at && (
                <span className="topic-date">
                  ✅ Lu le {formatDate(topic.learned_at)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
