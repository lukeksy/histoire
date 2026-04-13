import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar          from './components/Navbar';
import SwipePage       from './pages/SwipePage';
import LikedPage       from './pages/LikedPage';
import HistoryPage     from './pages/HistoryPage';
import TopicDetailPage from './pages/TopicDetailPage';
import LoginPage       from './pages/LoginPage';
import LoadingSpinner  from './components/LoadingSpinner';

export default function App() {
  const [authState, setAuthState] = useState('checking'); // 'checking' | 'in' | 'out'

  // Vérifie si une session active existe au chargement
  useEffect(() => {
    fetch('/api/auth/check')
      .then(r => r.json())
      .then(data => setAuthState(data.authenticated ? 'in' : 'out'))
      .catch(()  => setAuthState('out'));
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthState('out');
  }

  // Vérification en cours
  if (authState === 'checking') {
    return (
      <div className="app">
        <div className="page-content">
          <LoadingSpinner message="Chargement…" />
        </div>
      </div>
    );
  }

  // Non connecté → page de login
  if (authState === 'out') {
    return (
      <div className="app" style={{ overflow: 'auto' }}>
        <div className="page-content" style={{ overflow: 'auto' }}>
          <LoginPage onLogin={() => setAuthState('in')} />
        </div>
      </div>
    );
  }

  // Connecté → application complète
  return (
    <BrowserRouter>
      <div className="app">
        <div className="page-content">
          <Routes>
            <Route path="/"         element={<SwipePage />} />
            <Route path="/liked"    element={<LikedPage />} />
            <Route path="/history"  element={<HistoryPage />} />
            <Route path="/topic/:id" element={<TopicDetailPage />} />
          </Routes>
        </div>
        <Navbar onLogout={handleLogout} />
      </div>
    </BrowserRouter>
  );
}
