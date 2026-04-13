import { NavLink } from 'react-router-dom';

export default function Navbar({ onLogout }) {
  return (
    <nav className="navbar">
      <NavLink to="/" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">⚜️</span>
        <span>Découvrir</span>
      </NavLink>

      <NavLink to="/liked" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">❤️</span>
        <span>À lire</span>
      </NavLink>

      <NavLink to="/history" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">📚</span>
        <span>Lu</span>
      </NavLink>

      <button className="nav-btn" onClick={onLogout} title="Se déconnecter">
        <span className="nav-icon">🚪</span>
        <span>Quitter</span>
      </button>
    </nav>
  );
}
