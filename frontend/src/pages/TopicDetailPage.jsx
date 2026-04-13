import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

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
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

export default function TopicDetailPage() {
  const { id }            = useParams();
  const [searchParams]    = useSearchParams();
  const navigate          = useNavigate();
  const shouldGenerate    = searchParams.get('generate') === 'true';

  const [topic, setTopic]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError]         = useState(null);

  useEffect(() => {
    loadTopic();
  }, [id]);

  async function loadTopic() {
    try {
      setLoading(true);
      const data = await api.getTopic(id);
      setTopic(data.topic);

      // Si le contenu n'existe pas et qu'on doit générer
      if (!data.topic.content && shouldGenerate) {
        await generateContent(data.topic);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function generateContent(existingTopic) {
    try {
      setLoading(false);
      setGenerating(true);
      const data = await api.generateContent(id);
      setTopic(data.topic);
    } catch (err) {
      setError('Erreur lors de la génération de l\'article : ' + err.message);
    } finally {
      setGenerating(false);
    }
  }

  // Formater le contenu en paragraphes
  function renderContent(text) {
    if (!text) return null;
    return text.split('\n\n').map((paragraph, i) => (
      <p key={i} style={{ marginBottom: '1.2em' }}>{paragraph}</p>
    ));
  }

  if (loading) {
    return (
      <div className="detail-page">
        <button className="detail-back" onClick={() => navigate(-1)}>← Retour</button>
        <div className="loading-container" style={{ paddingTop: 40 }}>
          <div className="loading-spinner" />
          <p className="loading-text">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-page">
        <button className="detail-back" onClick={() => navigate(-1)}>← Retour</button>
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button className="btn-primary" style={{ marginTop: 8 }} onClick={loadTopic}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!topic) return null;

  return (
    <div className="detail-page">
      {/* Bouton retour */}
      <button className="detail-back" onClick={() => navigate(-1)}>
        ← Retour
      </button>

      {/* Badges */}
      <div className="detail-badges">
        <span className="badge badge-category">
          {CATEGORY_ICONS[topic.category] || '📚'} {topic.category}
        </span>
        <span className="badge badge-era">{topic.era}</span>
      </div>

      {/* Titre */}
      <h1 className="detail-title">{topic.title}</h1>

      {/* Badge "appris" si le contenu existe */}
      {topic.status === 'learned' && topic.learned_at && (
        <div className="detail-learned-badge">
          ✅ Lu le {formatDate(topic.learned_at)}
        </div>
      )}

      <div className="detail-divider" />

      {/* Contenu ou génération en cours */}
      {generating ? (
        <div className="detail-generating">
          <div className="loading-spinner" />
          <p>
            Claude rédige votre article…<br />
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              Cela prend environ 15–30 secondes
            </span>
          </p>
        </div>
      ) : topic.content ? (
        <div className="detail-content">
          {renderContent(topic.content)}
        </div>
      ) : (
        // Contenu pas encore généré et on n'a pas demandé la génération
        <div className="detail-generating">
          <p>L'article n'a pas encore été généré.</p>
          <button
            className="btn-primary"
            style={{ marginTop: 8 }}
            onClick={() => generateContent(topic)}
          >
            📖 Générer l'article
          </button>
        </div>
      )}
    </div>
  );
}
