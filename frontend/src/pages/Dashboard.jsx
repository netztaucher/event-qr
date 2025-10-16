import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({
    ticketsSold: 0,
    ticketsCheckedIn: 0,
    ticketsCheckedOut: 0,
    currentlyInside: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getTicketStats();
      setStats(response);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Fehler beim Laden der Statistiken');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Lade Dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchStats} className="action-btn">
            🔄 Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📊 Dashboard</h1>
        <p>Aktuelle Übersicht</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card sold">
          <div className="stat-icon">🎫</div>
          <div className="stat-content">
            <h3>Verkaufte Tickets</h3>
            <div className="stat-number">{stats.ticketsSold}</div>
          </div>
        </div>

        <div className="stat-card checked-in">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Eingecheckt</h3>
            <div className="stat-number">{stats.ticketsCheckedIn}</div>
          </div>
        </div>

        <div className="stat-card checked-out">
          <div className="stat-icon">🚪</div>
          <div className="stat-content">
            <h3>Ausgecheckt</h3>
            <div className="stat-number">{stats.ticketsCheckedOut}</div>
          </div>
        </div>

        <div className="stat-card current">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Aktuell Anwesend</h3>
            <div className="stat-number highlight">{stats.currentlyInside}</div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Schnellzugriff</h2>
        <div className="actions-grid">
          <button 
            className="action-btn scanner"
            onClick={() => navigate('/scanner')}
          >
            📱 Scanner öffnen
          </button>
          <button 
            className="action-btn refresh"
            onClick={fetchStats}
            disabled={loading}
          >
            {loading ? '🔄 Wird geladen...' : '🔄 Aktualisieren'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;