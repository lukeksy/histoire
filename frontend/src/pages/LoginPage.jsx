import { useState } from 'react';

export default function LoginPage({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password }),
      });
      const data = await res.json();

      if (res.ok) {
        onLogin();
      } else {
        setError(data.error || 'Mot de passe incorrect.');
        setPassword('');
      }
    } catch {
      setError('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-icon">⚜️</div>
        <h1 className="login-title">Histoire de France</h1>
        <p className="login-subtitle">Entrez votre mot de passe pour accéder</p>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="password"
            className="login-input"
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            required
          />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading || !password}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
