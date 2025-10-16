import React, { useState } from 'react';

const Scanner = () => {
  const [scanMode, setScanMode] = useState('checkin'); // 'checkin' or 'checkout'

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📱 QR Scanner</h1>
        <p>Ticket Check-in / Check-out</p>
      </div>

      <div className="scan-mode-selector">
        <button 
          className={`mode-btn ${scanMode === 'checkin' ? 'active' : ''}`}
          onClick={() => setScanMode('checkin')}
        >
          ➡️ Check-in
        </button>
        <button 
          className={`mode-btn ${scanMode === 'checkout' ? 'active' : ''}`}
          onClick={() => setScanMode('checkout')}
        >
          ⬅️ Check-out
        </button>
      </div>

      <div className="scanner-container">
        <div className="scanner-preview">
          {scanMode === 'checkin' ? (
            <div className="mode-info checkin">
              <h3>✅ Check-in Modus</h3>
              <p>Scanne QR-Codes für den Einlass</p>
            </div>
          ) : (
            <div className="mode-info checkout">
              <h3>🚪 Check-out Modus</h3>
              <p>Scanne QR-Codes für den Ausgang</p>
            </div>
          )}
          
          <div className="camera-placeholder">
            <div className="camera-icon">📷</div>
            <p>QR Scanner wird hier geladen...</p>
            <small>(QR-Scanner Implementierung folgt)</small>
          </div>
        </div>
      </div>

      <div className="scan-instructions">
        <h3>Anweisungen:</h3>
        <ul>
          <li>Wähle den gewünschten Modus (Check-in/Check-out)</li>
          <li>Halte das QR-Code-Ticket vor die Kamera</li>
          <li>Warte auf die Bestätigung</li>
          <li>Das System zeigt den Status des Tickets an</li>
        </ul>
      </div>
    </div>
  );
};

export default Scanner;