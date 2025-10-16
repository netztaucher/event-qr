import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navigation = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <h1>Event Scanner</h1>
        </div>
        
        {/* Desktop Navigation */}
        <div className="nav-menu desktop-menu">
          <Link 
            to="/dashboard" 
            className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
          >
            📊 Dashboard
          </Link>
          <Link 
            to="/scanner" 
            className={`nav-item ${isActive('/scanner') ? 'active' : ''}`}
          >
            📱 Scanner
          </Link>
        </div>

        {/* User Menu */}
        <div className="nav-user">
          <span className="user-info">👤 {user?.username}</span>
          <button onClick={handleLogout} className="logout-btn">
            Abmelden
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={toggleMobileMenu}
          aria-label="Menü öffnen"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="nav-menu mobile-menu">
          <Link 
            to="/dashboard" 
            className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            📊 Dashboard
          </Link>
          <Link 
            to="/scanner" 
            className={`nav-item ${isActive('/scanner') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            📱 Scanner
          </Link>
          <button 
            onClick={handleLogout} 
            className="nav-item logout-mobile"
          >
            🚪 Abmelden
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navigation;