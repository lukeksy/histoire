import { NavLink } from 'react-router-dom';

export default function Navbar() {
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
    </nav>
  );
}
