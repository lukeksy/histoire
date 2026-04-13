import { useState, useEffect, useRef, createRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import SwipeCard from '../components/SwipeCard';
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
  const [cardRefs, setCardRefs]         = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const navigate = useNavigate();

  // Ref pour accéder à currentIndex dans les callbacks sans stale closure
  const currentIndexRef = useRef(-1);
  const updateIndex = (val) => {
    setCurrentIndex(val);
    currentIndexRef.current = val;
  };

  useEffect(() => { loadTopics(); }, []);

  async function loadTopics() {
    try {
      setLoading(true);
      setError(null);
      const data    = await api.getDailyTopics();
      const pending = data.topics.filter(t => t.status === 'pending');
      const refs    = pending.map(() => createRef());
      setTopics(pending);
      setCardRefs(refs);
      updateIndex(pending.length - 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function regenerate() {
    try {
      setLoading(true);
      const data    = await api.regenerateTopics();
      const pending = data.topics.filter(t => t.status === 'pending');
      const refs    = pending.map(() => createRef());
      setTopics(pending);
      setCardRefs(refs);
      updateIndex(pending.length - 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Appelé par SwipeCard quand une carte part
  async function handleSwipe(direction, topic, index) {
    updateIndex(index - 1);
    try {
      await api.swipe(topic.id, direction);
      if (direction === 'up') {
        navigate(`/topic/${topic.id}?generate=true`);
      }
    } catch (err) {
      console.error('Erreur swipe:', err);
    }
  }

  // Swipe déclenché par les boutons du bas
  function swipeTop(direction) {
    const idx = currentIndexRef.current;
    if (idx >= 0 && cardRefs[idx]?.current) {
      cardRefs[idx].current.swipe(direction);
    }
  }

  const canSwipe = currentIndex >= 0;
  const today    = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  // ── Rendu ─────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="swipe-page">
      <div className="page-header"><h1>⚜️ Histoire de France</h1></div>
      <LoadingSpinner message={"Génération des sujets du jour\nvia Claude..."} />
    </div>
  );

  if (error) return (
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

  const noMoreCards = currentIndex < 0;

  return (
    <div className="swipe-page">
      <div className="page-header">
        <h1>⚜️ Découvrir</h1>
        <p className="subtitle">{today}</p>
      </div>

      {noMoreCards ? (
        <div className="no-more-cards">
          <div className="fleur-de-lis">⚜️</div>
          <h2>C'est tout pour aujourd'hui !</h2>
          <p>Vous avez exploré tous les sujets du jour. Consultez vos sujets likés ou régénérez une nouvelle série.</p>
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
            {topics.map((topic, index) => {
              // N'afficher que les 3 premières cartes depuis le dessus (perf)
              const stackOffset = currentIndex - index;
              if (stackOffset > 2 || stackOffset < 0) return null;

              return (
                <SwipeCard
                  key={topic.id}
                  ref={cardRefs[index]}
                  topic={topic}
                  isTop={index === currentIndex}
                  stackOffset={stackOffset}
                  categoryIcon={CATEGORY_ICONS[topic.category] || '📚'}
                  onSwipe={(dir) => handleSwipe(dir, topic, index)}
                />
              );
            })}
          </div>

          {/* Compteur */}
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
            {currentIndex + 1} / {topics.length}
          </div>

          {/* Boutons d'action */}
          <div className="action-buttons">
            <button className="action-btn dislike" onClick={() => swipeTop('left')}  disabled={!canSwipe} title="Passer">✖️</button>
            <button className="action-btn super"   onClick={() => swipeTop('up')}    disabled={!canSwipe} title="Étudier maintenant">⚡</button>
            <button className="action-btn like"    onClick={() => swipeTop('right')} disabled={!canSwipe} title="Liker">❤️</button>
          </div>
        </>
      )}
    </div>
  );
}
