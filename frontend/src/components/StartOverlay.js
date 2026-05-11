// src/components/StartOverlay.js
import React from 'react';

export default function StartOverlay({ setStarted }) {
  return (
    <div className="start-overlay" onClick={() => setStarted(true)}>
      <div className="start-modal">
        <h2>Welcome to the AI Voice Bot</h2>
        <p>Click anywhere or press Start to begin.</p>
        <button onClick={() => setStarted(true)}>Start</button>
      </div>
    </div>
  );
}
