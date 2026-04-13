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
    day: 'numeric', month: 'long'
  });
}

export default function LikedPage() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const data = await api.getLikedTopics();
      setTopics(data.topics);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner message="Chargement des sujets likés..." />;

  return (
    <div>
      <div className="page-header">
        <h1>❤️ À lire</h1>
        <p className="subtitle">
          {topics.length === 0
            ? 'Aucun sujet sauvegardé'
            : `${topics.length} sujet${topics.length > 1 ? 's' : ''} à explorer`}
        </p>
      </div>

      {error && (
        <div style={{ padding: '16px', color: '#e07777', textAlign: 'center', fontSize: 14 }}>
          {error}
        </div>
      )}

      {topics.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">💭</span>
          <h3>Rien ici pour l'instant</h3>
          <p>
            Swipez vers la droite sur les sujets qui vous intéressent
            pour les retrouver ici.
          </p>
        </div>
      ) : (
        <div className="topics-list">
          {topics.map(topic => (
            <div key={topic.id} className="topic-item">
              <div className="topic-item-header">
                <h3 className="topic-item-title">{topic.title}</h3>
                {topic.status === 'super_liked' && (
                  <span title="Super like" style={{ fontSize: 18 }}>⚡</span>
                )}
              </div>

              <p className="topic-item-summary">{topic.summary}</p>

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
                  className="btn-learn"
                  onClick={() => navigate(`/topic/${topic.id}?generate=true`)}
                >
                  📖 Apprendre
                </button>
              </div>

              {topic.swiped_at && (
                <span className="topic-date">
                  Sauvegardé le {formatDate(topic.swiped_at)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
