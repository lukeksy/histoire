/**
 * SwipeCard — composant de swipe maison, sans dépendance externe.
 * Utilise l'API Pointer Events (fonctionne souris + tactile).
 *
 * Props :
 *   topic       : objet sujet à afficher
 *   onSwipe(dir): appelé avec 'left' | 'right' | 'up' quand la carte part
 *   isTop       : booléen, true si c'est la carte du dessus
 *   stackOffset : 0 = top, 1 = deuxième, 2 = troisième...
 *   categoryIcon: emoji de la catégorie
 *
 * Ref exposée : swipe(direction) — pour les boutons
 */

import { forwardRef, useImperativeHandle, useRef, useState, useCallback } from 'react';

const SWIPE_THRESHOLD = 80;   // pixels pour déclencher un swipe
const ROTATION_MAX   = 15;    // degrés de rotation max

const SwipeCard = forwardRef(function SwipeCard(
  { topic, onSwipe, isTop, stackOffset = 0, categoryIcon },
  ref
) {
  const [pos, setPos]           = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [gone, setGone]         = useState(false);
  const startRef  = useRef({ x: 0, y: 0 });
  const cardRef   = useRef(null);

  // ── API impérative exposée au parent ──────────────────────────────────
  useImperativeHandle(ref, () => ({
    swipe: (direction) => flyAway(direction),
  }));

  // ── Helpers ───────────────────────────────────────────────────────────
  const getXY = (e) => e.touches
    ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
    : { x: e.clientX,            y: e.clientY };

  const flyAway = useCallback((direction) => {
    if (gone) return;
    setGone(true);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const dest = {
      left:  { x: -vw * 1.6, y:  20 },
      right: { x:  vw * 1.6, y:  20 },
      up:    { x:  0,         y: -vh * 1.5 },
    }[direction] ?? { x: 0, y: 0 };
    setPos(dest);
    setTimeout(() => onSwipe(direction), 380);
  }, [gone, onSwipe]);

  // ── Pointer events (souris + tactile) ─────────────────────────────────
  const onPointerDown = (e) => {
    if (!isTop || gone) return;
    startRef.current = getXY(e);
    setDragging(true);
    // setPointerCapture garde le tracking même si le curseur sort de l'élément
    cardRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragging || !isTop || gone) return;
    const { x, y } = getXY(e);
    setPos({ x: x - startRef.current.x, y: y - startRef.current.y });
  };

  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    const { x, y } = pos;
    const absX = Math.abs(x), absY = Math.abs(y);

    if (y < -SWIPE_THRESHOLD && absY > absX)  flyAway('up');
    else if (x >  SWIPE_THRESHOLD)             flyAway('right');
    else if (x < -SWIPE_THRESHOLD)             flyAway('left');
    else                                        setPos({ x: 0, y: 0 }); // retour au centre
  };

  // ── Visuel ────────────────────────────────────────────────────────────
  const rotation  = pos.x * 0.08;
  const clampedR  = Math.max(-ROTATION_MAX, Math.min(ROTATION_MAX, rotation));

  // Indicateur de direction affiché sur la carte en cours de drag
  const hint = !dragging ? null
    : pos.y < -40 && Math.abs(pos.y) > Math.abs(pos.x) ? 'super'
    : pos.x >  40 ? 'like'
    : pos.x < -40 ? 'dislike'
    : null;

  // Effet de profondeur pour les cartes en dessous
  const depthScale     = 1 - stackOffset * 0.04;
  const depthTranslateY = stackOffset * 10;

  const transform = isTop
    ? `translateX(${pos.x}px) translateY(${pos.y}px) rotate(${clampedR}deg)`
    : `translateY(${depthTranslateY}px) scale(${depthScale})`;

  const transition = dragging
    ? 'none'
    : gone
      ? 'transform 0.38s ease, opacity 0.38s ease'
      : 'transform 0.3s ease';

  return (
    <div
      ref={cardRef}
      style={{
        position:   'absolute',
        width:      '100%',
        display:    'flex',
        justifyContent: 'center',
        transform,
        transition,
        zIndex:     100 - stackOffset,
        opacity:    gone ? 0 : 1,
        touchAction: 'none',
        userSelect:  'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="swipe-card" style={{ cursor: isTop ? (dragging ? 'grabbing' : 'grab') : 'default' }}>

        {/* Indicateurs directionnels */}
        <div className="swipe-indicator like"    style={{ opacity: hint === 'like'    ? 1 : 0 }}>❤️ Liker</div>
        <div className="swipe-indicator dislike" style={{ opacity: hint === 'dislike' ? 1 : 0 }}>✖️ Passer</div>
        <div className="swipe-indicator super"   style={{ opacity: hint === 'super'   ? 1 : 0 }}>⚡ Étudier !</div>

        {/* Badges */}
        <div className="card-badges">
          <span className="badge badge-category">{categoryIcon} {topic.category}</span>
          <span className="badge badge-era">{topic.era}</span>
        </div>

        {/* Contenu */}
        <h2 className="card-title">{topic.title}</h2>
        <p  className="card-summary">{topic.summary}</p>

        <div style={{ flex: 1 }} />
        <span className="swipe-hint">← Passer · ❤️ Liker → · ⚡ Étudier ↑</span>
      </div>
    </div>
  );
});

export default SwipeCard;
