import { useState, useEffect, useRef, createRef, useCallback } from 'react';
import TinderCard from 'react-tinder-card';
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

export default function SwipePage() {
  const [topics, setTopics]             = useState([]);
  const [childRefs, setChildRefs]       = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [hint, setHint]                 = useState(null); // 'like' | 'dislike' | 'super'
  const navigate = useNavigate();

  // Ref pour avoir accès à currentIndex dans les callbacks sans stale closure
  const currentIndexRef = useRef(currentIndex);

  const updateCurrentIndex = (val) => {
    setCurrentIndex(val);
    currentIndexRef.current = val;
  };

  useEffect(() => {
    loadTopics();
  }, []);

  async function loadTopics() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDailyTopics();
      // Afficher seulement les sujets pas encore swipés
      const pending = data.topics.filter(t => t.status === 'pending');
      const refs = pending.map(() => createRef());
      setTopics(pending);
      setChildRefs(refs);
      updateCurrentIndex(pending.length - 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function regenerate() {
    try {
      setLoading(true);
      const data = await api.regenerateTopics();
      const pending = data.topics.filter(t => t.status === 'pending');
      const refs = pending.map(() => createRef());
      setTopics(pending);
      setChildRefs(refs);
      updateCurrentIndex(pending.length - 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Callback appelé quand une carte est swipée
  const onSwipe = useCallback(async (direction, topic, index) => {
    setHint(null);
    updateCurrentIndex(index - 1);

    try {
      await api.swipe(topic.id, direction);
      if (direction === 'up') {
        // Super swipe → générer l'article immédiatement
        navigate(`/topic/${topic.id}?generate=true`);
      }
    } catch (err) {
      console.error('Erreur swipe:', err);
    }
  }, [navigate]);

  // Swipe programmatique via les boutons
  const swipe = async (dir) => {
    const idx = currentIndexRef.current;
    if (idx >= 0 && childRefs[idx]?.current) {
      // Montrer l'indicateur visuel
      if (dir === 'right') setHint('like');
      else if (dir === 'left') setHint('dislike');
      else if (dir === 'up') setHint('super');
      await childRefs[idx].current.swipe(dir);
    }
  };

  const canSwipe = currentIndex >= 0;
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  if (loading) {
    return (
      <div className="swipe-page">
        <div className="page-header">
          <h1>⚜️ Histoire de France</h1>
        </div>
        <LoadingSpinner message={"Génération des sujets du jour\nvia Claude..."} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="swipe-page">
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button className="btn-primary" style={{ marginTop: 8 }} onClick={loadTopics}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const noMoreCards = currentIndex < 0;

  return (
    <div className="swipe-page">
      <div className="page-header">
        <h1>⚜️ Découvrir</h1>
        <p className="subtitle">{today}</p>
      </div>

      {noMoreCards ? (
        // Tous les sujets ont été swipés
        <div className="no-more-cards">
          <div className="fleur-de-lis">⚜️</div>
          <h2>C'est tout pour aujourd'hui !</h2>
          <p>
            Vous avez exploré tous les sujets du jour. Consultez vos sujets likés
            ou régénérez une nouvelle série.
          </p>
          <button className="btn-primary" onClick={() => navigate('/liked')}>
            Voir mes sujets likés →
          </button>
          <button className="btn-secondary" onClick={regenerate}>
            🔄 Nouveaux sujets
          </button>
        </div>
      ) : (
        <>
          {/* Pile de cartes */}
          <div className="cards-container">
            {topics.map((topic, index) => (
              <TinderCard
                ref={childRefs[index]}
                key={topic.id}
                onSwipe={(dir) => onSwipe(dir, topic, index)}
                preventSwipe={[]}
                swipeRequirementType="position"
                swipeThreshold={80}
              >
                <div className="swipe-card">
                  {/* Indicateurs visuels de direction */}
                  {index === currentIndex && (
                    <>
                      <div className="swipe-indicator like"
                           style={{ opacity: hint === 'like' ? 1 : 0 }}>
                        ❤️ Liker
                      </div>
                      <div className="swipe-indicator dislike"
                           style={{ opacity: hint === 'dislike' ? 1 : 0 }}>
                        ✖️ Passer
                      </div>
                      <div className="swipe-indicator super"
                           style={{ opacity: hint === 'super' ? 1 : 0 }}>
                        ⚡ Étudier !
                      </div>
                    </>
                  )}

                  <div className="card-badges">
                    <span className="badge badge-category">
                      {CATEGORY_ICONS[topic.category] || '📚'} {topic.category}
                    </span>
                    <span className="badge badge-era">{topic.era}</span>
                  </div>

                  <h2 className="card-title">{topic.title}</h2>
                  <p className="card-summary">{topic.summary}</p>

                  <div style={{ flex: 1 }} />

                  <div className="card-counter">
                    {topics.length - currentIndex - 1 > 0
                      ? `${topics.length - currentIndex - 1} sujet(s) déjà passé(s) · `
                      : ''}
                    {currentIndex + 1} restant{currentIndex + 1 > 1 ? 's' : ''}
                  </div>
                  <span className="swipe-hint">← Passer · ❤️ Liker → · ⚡ Étudier ↑</span>
                </div>
              </TinderCard>
            ))}
          </div>

          {/* Boutons d'action */}
          <div className="action-buttons">
            <button
              className="action-btn dislike"
              onClick={() => swipe('left')}
              disabled={!canSwipe}
              title="Passer (swipe gauche)"
            >
              ✖️
            </button>
            <button
              className="action-btn super"
              onClick={() => swipe('up')}
              disabled={!canSwipe}
              title="Étudier maintenant (swipe haut)"
            >
              ⚡
            </button>
            <button
              className="action-btn like"
              onClick={() => swipe('right')}
              disabled={!canSwipe}
              title="Liker (swipe droit)"
            >
              ❤️
            </button>
          </div>
        </>
      )}
    </div>
  );
}
